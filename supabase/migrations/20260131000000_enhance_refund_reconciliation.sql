-- Migration: Enhance Refund System with Cash Reconciliation
-- Adds cash tracking, daily limits, and fraud prevention to refund system

-- 1. Add cash reconciliation columns to refunds table
ALTER TABLE public.refunds
ADD COLUMN IF NOT EXISTS cash_returned_amount DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS cash_returned_by UUID REFERENCES public.users(id),
ADD COLUMN IF NOT EXISTS cash_returned_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS register_balance_before DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS register_balance_after DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS variance_amount DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS requires_additional_review BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS additional_review_reason TEXT;

-- 2. Create function to check daily refund limit
CREATE OR REPLACE FUNCTION public.check_daily_refund_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_daily_count INTEGER;
  v_daily_total DECIMAL;
BEGIN
  -- Count refunds initiated by this user today
  SELECT COUNT(*), COALESCE(SUM(refund_amount), 0)
  INTO v_daily_count, v_daily_total
  FROM public.refunds
  WHERE initiated_by = NEW.initiated_by
    AND DATE(initiated_at) = CURRENT_DATE;

  -- Check limits
  IF v_daily_count >= 5 THEN
    RAISE EXCEPTION 'Daily refund limit exceeded: Maximum 5 refunds per cashier per day';
  END IF;

  IF v_daily_total + NEW.refund_amount > 100000 THEN
    RAISE EXCEPTION 'Daily refund amount limit exceeded: Maximum ₦100,000 per cashier per day';
  END IF;

  -- Flag for additional review if amount is high
  IF NEW.refund_amount > 50000 THEN
    NEW.requires_additional_review := TRUE;
    NEW.additional_review_reason := 'High value refund (>₦50,000)';
  END IF;

  RETURN NEW;
END;
$$;

-- 3. Create trigger for refund limit enforcement
DROP TRIGGER IF EXISTS enforce_refund_limits ON public.refunds;
CREATE TRIGGER enforce_refund_limits
  BEFORE INSERT ON public.refunds
  FOR EACH ROW
  EXECUTE FUNCTION public.check_daily_refund_limit();

-- 4. Create function to process refund with cash reconciliation
CREATE OR REPLACE FUNCTION public.process_refund_with_cash_tracking(
  p_refund_id UUID,
  p_action TEXT, -- 'approve' or 'reject'
  p_rejection_reason TEXT,
  p_admin_id UUID,
  p_admin_name TEXT,
  p_cash_returned_amount DECIMAL,
  p_register_balance_before DECIMAL,
  p_register_balance_after DECIMAL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_refund RECORD;
  v_item JSONB;
  v_product_id UUID;
  v_qty INTEGER;
  v_variance DECIMAL;
BEGIN
  -- Get refund details
  SELECT * INTO v_refund FROM public.refunds WHERE id = p_refund_id FOR UPDATE;
  
  IF v_refund IS NULL THEN
    RAISE EXCEPTION 'Refund not found';
  END IF;

  IF v_refund.status != 'pending' THEN
    RAISE EXCEPTION 'Refund is already processed (status: %)', v_refund.status;
  END IF;

  -- Calculate variance
  v_variance := p_register_balance_before - p_cash_returned_amount - p_register_balance_after;

  -- Update refund status
  UPDATE public.refunds 
  SET 
    status = CASE WHEN p_action = 'approve' THEN 'approved' ELSE 'rejected' END,
    approved_by = p_admin_id,
    approved_by_name = p_admin_name,
    approved_at = NOW(),
    rejection_reason = p_rejection_reason,
    cash_returned_amount = p_cash_returned_amount,
    cash_returned_by = p_admin_id,
    cash_returned_at = NOW(),
    register_balance_before = p_register_balance_before,
    register_balance_after = p_register_balance_after,
    variance_amount = v_variance
  WHERE id = p_refund_id;

  -- IF APPROVED: RESTOCK INVENTORY
  IF p_action = 'approve' THEN
    -- Loop through items in the JSONB array
    FOR v_item IN SELECT * FROM jsonb_array_elements(v_refund.items)
    LOOP
      v_product_id := (v_item->>'product_id')::UUID;
      v_qty := (v_item->>'quantity')::INTEGER;

      -- Update Inventory Quantity
      UPDATE public.inventory
      SET quantity = quantity + v_qty,
          last_updated_at = NOW(),
          last_updated_by = p_admin_id
      WHERE id = v_product_id;

      -- Log Stock Movement (RETURN)
      INSERT INTO public.stock_movements (
        product_id, 
        quantity_change, 
        previous_quantity, 
        new_quantity, 
        type, 
        reason, 
        created_by,
        reference_id
      )
      SELECT 
        id, 
        v_qty, 
        quantity - v_qty, 
        quantity, 
        'RETURN', 
        'Refund Approved: ' || v_refund.transaction_id || ' (Cash: ₦' || p_cash_returned_amount || ')', 
        p_admin_id,
        p_refund_id
      FROM public.inventory WHERE id = v_product_id;
      
    END LOOP;

    -- Log audit event
    PERFORM public.log_audit_event(
      'REFUND_APPROVED',
      p_admin_id,
      (SELECT email FROM auth.users WHERE id = p_admin_id),
      'ADMIN',
      'Refund approved with cash reconciliation',
      'refunds',
      p_refund_id::text,
      jsonb_build_object(
        'refund_amount', v_refund.refund_amount,
        'cash_returned', p_cash_returned_amount,
        'variance', v_variance,
        'transaction_id', v_refund.transaction_id
      )
    );
  ELSE
    -- Log rejection
    PERFORM public.log_audit_event(
      'REFUND_REJECTED',
      p_admin_id,
      (SELECT email FROM auth.users WHERE id = p_admin_id),
      'ADMIN',
      'Refund rejected: ' || p_rejection_reason,
      'refunds',
      p_refund_id::text,
      jsonb_build_object(
        'refund_amount', v_refund.refund_amount,
        'rejection_reason', p_rejection_reason,
        'transaction_id', v_refund.transaction_id
      )
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'status', CASE WHEN p_action = 'approve' THEN 'approved' ELSE 'rejected' END,
    'variance', v_variance
  );
END;
$$;

-- 5. Create view for daily refund reconciliation report
CREATE OR REPLACE VIEW public.daily_refund_reconciliation AS
SELECT 
  DATE(r.initiated_at) as refund_date,
  r.initiated_by,
  r.initiated_by_name,
  COUNT(*) as total_refunds,
  SUM(r.refund_amount) as total_refund_amount,
  SUM(r.cash_returned_amount) as total_cash_returned,
  SUM(r.variance_amount) as total_variance,
  SUM(CASE WHEN r.status = 'approved' THEN 1 ELSE 0 END) as approved_count,
  SUM(CASE WHEN r.status = 'rejected' THEN 1 ELSE 0 END) as rejected_count,
  SUM(CASE WHEN r.status = 'pending' THEN 1 ELSE 0 END) as pending_count,
  SUM(CASE WHEN r.requires_additional_review THEN 1 ELSE 0 END) as flagged_count
FROM public.refunds r
GROUP BY DATE(r.initiated_at), r.initiated_by, r.initiated_by_name
ORDER BY refund_date DESC, total_variance DESC;

-- 6. Grant permissions
GRANT EXECUTE ON FUNCTION public.process_refund_with_cash_tracking TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_refund_with_cash_tracking TO service_role;
GRANT SELECT ON public.daily_refund_reconciliation TO authenticated;

-- 7. Add comments
COMMENT ON COLUMN public.refunds.cash_returned_amount IS 'Actual cash amount returned to customer';
COMMENT ON COLUMN public.refunds.register_balance_before IS 'Cash register balance before refund';
COMMENT ON COLUMN public.refunds.register_balance_after IS 'Cash register balance after refund';
COMMENT ON COLUMN public.refunds.variance_amount IS 'Calculated variance (should be zero if reconciled correctly)';
COMMENT ON COLUMN public.refunds.requires_additional_review IS 'Flagged for additional review (high value, suspicious pattern)';

COMMENT ON FUNCTION public.process_refund_with_cash_tracking IS 'Processes refund approval/rejection with cash reconciliation tracking to prevent fraud';
COMMENT ON VIEW public.daily_refund_reconciliation IS 'Daily summary of refunds by cashier for reconciliation and fraud detection';

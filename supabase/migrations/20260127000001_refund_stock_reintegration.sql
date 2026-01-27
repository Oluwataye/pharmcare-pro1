
-- Migration: Atomic Refund Processing & Stock Reintegration

CREATE OR REPLACE FUNCTION public.process_refund_transaction(
  p_refund_id UUID,
  p_action TEXT,
  p_rejection_reason TEXT,
  p_admin_id UUID,
  p_admin_name TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_refund RECORD;
  v_item JSONB;
  v_current_stock INTEGER;
  v_result JSONB;
BEGIN
  -- 1. Lock and fetch the refund record
  SELECT * FROM public.refunds WHERE id = p_refund_id FOR UPDATE INTO v_refund;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Refund record with ID % not found', p_refund_id;
  END IF;

  IF v_refund.status != 'pending' THEN
    RAISE EXCEPTION 'Refund is already %', v_refund.status;
  END IF;

  -- 2. Handle Rejection
  IF p_action = 'reject' THEN
    UPDATE public.refunds
    SET 
      status = 'rejected',
      rejection_reason = p_rejection_reason,
      approved_by = p_admin_id,
      approved_by_name = p_admin_name,
      approved_at = NOW(),
      updated_at = NOW()
    WHERE id = p_refund_id;

    RETURN jsonb_build_object('success', true, 'status', 'rejected');
  END IF;

  -- 3. Handle Approval & Stock Reintegration
  IF p_action = 'approve' THEN
    -- A. Update Refund status
    UPDATE public.refunds
    SET 
      status = 'approved',
      approved_by = p_admin_id,
      approved_by_name = p_admin_name,
      approved_at = NOW(),
      updated_at = NOW()
    WHERE id = p_refund_id;

    -- B. Reintegrate Stock for each item
    -- Note: v_refund.items is JSONB array
    FOR v_item IN SELECT * FROM jsonb_array_elements(v_refund.items)
    LOOP
      -- Get current stock and lock row
      SELECT quantity INTO v_current_stock
      FROM public.inventory
      WHERE id = (v_item->>'product_id')::UUID
      FOR UPDATE;

      IF FOUND THEN
        -- Atomic Stock Reintegration
        UPDATE public.inventory
        SET 
          quantity = quantity + (v_item->>'quantity')::INTEGER,
          last_updated_at = NOW(),
          last_updated_by = p_admin_id
        WHERE id = (v_item->>'product_id')::UUID;

        -- Log Stock Movement (RETURN)
        INSERT INTO public.stock_movements (
          product_id,
          quantity_change,
          previous_quantity,
          new_quantity,
          type,
          reason,
          reference_id,
          created_by
        ) VALUES (
          (v_item->>'product_id')::UUID,
          (v_item->>'quantity')::INTEGER,
          v_current_stock,
          v_current_stock + (v_item->>'quantity')::INTEGER,
          'PURCHASE_RETURN', -- Using appropriate type for return to stock
          'Refund Credit for ' || v_refund.transaction_id,
          v_refund.id,
          p_admin_id
        );
      END IF;
    END LOOP;

    -- C. Log Audit Event
    PERFORM public.log_audit_event(
      'REFUND_APPROVED',
      p_admin_id,
      p_admin_name,
      'ADMIN',
      'Refund processed with stock reintegration',
      'refunds',
      p_refund_id::text,
      jsonb_build_object(
        'transactionId', v_refund.transaction_id,
        'amount', v_refund.refund_amount,
        'itemsCount', jsonb_array_length(v_refund.items)
      )
    );

    RETURN jsonb_build_object('success', true, 'status', 'approved');
  END IF;

  RAISE EXCEPTION 'Invalid action: %', p_action;

EXCEPTION WHEN OTHERS THEN
  RAISE;
END;
$$;

-- Grant access
GRANT EXECUTE ON FUNCTION public.process_refund_transaction TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_refund_transaction TO service_role;

COMMENT ON FUNCTION public.process_refund_transaction IS 'Processes a refund atomically: updates status, reintegrates stock to inventory, and logs movements.';

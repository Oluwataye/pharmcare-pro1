
-- Migration: Transactional Sales Integrity & Stock Hardening

-- 1. Add Database Constraint to prevent negative stock
-- This is the "Last Line of Defense"
ALTER TABLE public.inventory 
ADD CONSTRAINT inventory_quantity_check 
CHECK (quantity >= 0);

-- 2. Create the Atomic Sale Transaction RPC
CREATE OR REPLACE FUNCTION public.process_sale_transaction(
  p_transaction_id TEXT,
  p_total DECIMAL,
  p_discount DECIMAL,
  p_manual_discount DECIMAL,
  p_customer_name TEXT,
  p_customer_phone TEXT,
  p_business_name TEXT,
  p_business_address TEXT,
  p_sale_type TEXT,
  p_cashier_id UUID,
  p_cashier_name TEXT,
  p_cashier_email TEXT,
  p_items JSONB -- Array of items
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sale_id UUID;
  v_item RECORD;
  v_current_stock INTEGER;
  v_cost_price DECIMAL;
  v_total_cost DECIMAL := 0;
  v_gross_profit DECIMAL;
  v_result JSONB;
BEGIN
  -- SET TRANSACTION ISOLATION LEVEL SERIALIZABLE; -- Optional: for extreme concurrency safety

  -- 1. Insert Master Sale Record
  INSERT INTO public.sales (
    transaction_id,
    total,
    discount,
    manual_discount,
    customer_name,
    customer_phone,
    business_name,
    business_address,
    sale_type,
    status,
    cashier_id,
    cashier_name,
    cashier_email
  ) VALUES (
    p_transaction_id,
    p_total,
    p_discount,
    p_manual_discount,
    p_customer_name,
    p_customer_phone,
    p_business_name,
    p_business_address,
    p_sale_type,
    'completed',
    p_cashier_id,
    p_cashier_name,
    p_cashier_email
  )
  RETURNING id INTO v_sale_id;

  -- 2. Process each item
  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(
    product_id UUID,
    product_name TEXT,
    quantity INTEGER,
    unit_price DECIMAL,
    price DECIMAL,
    discount DECIMAL,
    is_wholesale BOOLEAN,
    total DECIMAL
  )
  LOOP
    -- A. Fetch current stock and cost price with row lock (locking for update)
    SELECT quantity, cost_price INTO v_current_stock, v_cost_price
    FROM public.inventory
    WHERE id = v_item.product_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product with ID % not found', v_item.product_id;
    END IF;

    -- B. Verify Stock Availability (Atomic Check)
    IF v_current_stock < v_item.quantity THEN
      RAISE EXCEPTION 'Insufficient stock for %. Available: %, Requested: %', 
        v_item.product_name, v_current_stock, v_item.quantity;
    END IF;

    -- C. Deduct Stock (Atomic SQL Update)
    UPDATE public.inventory
    SET 
      quantity = quantity - v_item.quantity,
      last_updated_at = NOW(),
      last_updated_by = p_cashier_id
    WHERE id = v_item.product_id;

    -- D. Record Sale Item (Capturing Cost)
    INSERT INTO public.sales_items (
      sale_id,
      product_id,
      product_name,
      quantity,
      unit_price,
      price,
      cost_price,
      discount,
      is_wholesale,
      total
    ) VALUES (
      v_sale_id,
      v_item.product_id,
      v_item.product_name,
      v_item.quantity,
      v_item.unit_price,
      v_item.price,
      COALESCE(v_cost_price, 0),
      COALESCE(v_item.discount, 0),
      v_item.is_wholesale,
      v_item.total
    );

    -- E. Create Stock Movement Record
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
      v_item.product_id,
      -v_item.quantity,
      v_current_stock,
      v_current_stock - v_item.quantity,
      'SALE',
      'Sale Transaction ' || p_transaction_id,
      v_sale_id,
      p_cashier_id
    );

    -- Calculate total cost for profit tracking
    v_total_cost := v_total_cost + (COALESCE(v_cost_price, 0) * v_item.quantity);
  END LOOP;

  -- 3. Calculate Final Profit (Optional update to master sale if column added later)
  v_gross_profit := p_total - v_total_cost;

  -- 4. Log Audit Event
  PERFORM public.log_audit_event(
    'SALE_COMPLETED',
    p_cashier_id,
    p_cashier_email,
    'DISPENSER', -- Simplified for RPC, can be refined
    'Sale processed atomically via RPC',
    'sales',
    v_sale_id::text,
    jsonb_build_object(
      'transactionId', p_transaction_id,
      'total', p_total,
      'profit', v_gross_profit,
      'itemCount', jsonb_array_length(p_items)
    )
  );

  -- Return Success
  v_result := jsonb_build_object(
    'success', true,
    'sale_id', v_sale_id,
    'transaction_id', p_transaction_id,
    'profit', v_gross_profit
  );

  RETURN v_result;

EXCEPTION WHEN OTHERS THEN
  -- Transaction will roll back automatically on error
  RAISE;
END;
$$;

-- Grant access to authenticated users
GRANT EXECUTE ON FUNCTION public.process_sale_transaction TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_sale_transaction TO service_role;

COMMENT ON FUNCTION public.process_sale_transaction IS 'Processes a sale transaction atomically: creates sale, deducts stock, records items, and logs movements.';

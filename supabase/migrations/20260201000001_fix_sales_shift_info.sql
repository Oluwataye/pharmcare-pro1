
-- Migration: Fix Missing Shift Information in Sales Transactions
-- This migration updates the process_sale_transaction RPC to accept and store shift and role information.

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
  p_items JSONB,
  p_shift_name TEXT DEFAULT NULL,
  p_shift_id UUID DEFAULT NULL,
  p_staff_role TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sale_id UUID;
  v_item RECORD;
  v_batch RECORD;
  v_remaining_qty INTEGER;
  v_qty_to_deduct INTEGER;
  v_total_available INTEGER;
  v_total_cost DECIMAL := 0;
  v_item_cost DECIMAL;
  v_gross_profit DECIMAL;
  v_result JSONB;
BEGIN
  -- 1. Insert Master Sale Record with Shift Info
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
    cashier_email,
    shift_name,
    shift_id,
    staff_role
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
    p_cashier_email,
    p_shift_name,
    p_shift_id,
    p_staff_role
  )
  RETURNING id INTO v_sale_id;

  -- 2. Process each item (FEFO Batch Logic)
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
    -- Check Global Availability
    SELECT SUM(quantity) INTO v_total_available
    FROM public.inventory_batches
    WHERE inventory_id = v_item.product_id
      AND expiry_date >= CURRENT_DATE;
    
    IF v_total_available IS NULL OR v_total_available < v_item.quantity THEN
      RAISE EXCEPTION 'Insufficient stock for %. Requested: %, Available: %', 
        v_item.product_name, v_item.quantity, COALESCE(v_total_available, 0);
    END IF;

    v_remaining_qty := v_item.quantity;
    v_item_cost := 0;

    FOR v_batch IN 
      SELECT id, quantity, cost_price, expiry_date, batch_number
      FROM public.inventory_batches
      WHERE inventory_id = v_item.product_id
        AND quantity > 0
        AND expiry_date >= CURRENT_DATE
      ORDER BY expiry_date ASC, created_at ASC
      FOR UPDATE
    LOOP
      IF v_remaining_qty <= 0 THEN
        EXIT;
      END IF;

      IF v_batch.quantity >= v_remaining_qty THEN
        v_qty_to_deduct := v_remaining_qty;
      ELSE
        v_qty_to_deduct := v_batch.quantity;
      END IF;

      UPDATE public.inventory_batches
      SET quantity = quantity - v_qty_to_deduct,
          updated_at = NOW()
      WHERE id = v_batch.id;

      v_item_cost := v_item_cost + (COALESCE(v_batch.cost_price, 0) * v_qty_to_deduct);

      INSERT INTO public.stock_movements (
        product_id,
        quantity_change,
        previous_quantity,
        new_quantity,
        type,
        reason,
        reference_id,
        created_by,
        batch_number
      ) VALUES (
        v_item.product_id,
        -v_qty_to_deduct,
        v_batch.quantity,
        v_batch.quantity - v_qty_to_deduct,
        'SALE',
        'Sale ' || p_transaction_id || ' (Batch: ' || v_batch.batch_number || ')',
        v_sale_id,
        p_cashier_id,
        v_batch.batch_number
      );

      v_remaining_qty := v_remaining_qty - v_qty_to_deduct;
    END LOOP;

    -- Record Sale Item
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
      (v_item_cost / v_item.quantity),
      COALESCE(v_item.discount, 0),
      v_item.is_wholesale,
      v_item.total
    );

    v_total_cost := v_total_cost + v_item_cost;
  END LOOP;

  -- 3. Calculate Profit
  v_gross_profit := p_total - v_total_cost;

  -- 4. Log Audit Event
  PERFORM public.log_audit_event(
    'SALE_COMPLETED',
    p_cashier_id,
    p_cashier_email,
    p_staff_role,
    'Sale processed with Shift: ' || COALESCE(p_shift_name, 'None'),
    'sales',
    v_sale_id::text,
    jsonb_build_object(
      'transactionId', p_transaction_id,
      'total', p_total,
      'profit', v_gross_profit,
      'shiftId', p_shift_id
    )
  );

  v_result := jsonb_build_object(
    'success', true,
    'sale_id', v_sale_id,
    'transaction_id', p_transaction_id,
    'profit', v_gross_profit
  );

  RETURN v_result;
END;
$$;

-- Migration: Update Sales RPC with FEFO and Expiry Enforcement

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
  
  -- Variables for batch processing
  v_batch RECORD;
  v_qty_needed INTEGER;
  v_qty_to_deduct INTEGER;
  v_batch_movements JSONB := '[]'::JSONB; -- To track which batches were used
BEGIN
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
    -- A. Fetch current Total stock and cost price with row lock
    SELECT quantity, cost_price INTO v_current_stock, v_cost_price
    FROM public.inventory
    WHERE id = v_item.product_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product with ID % not found', v_item.product_id;
    END IF;

    -- B. Verify Total Stock Availability
    IF v_current_stock < v_item.quantity THEN
      RAISE EXCEPTION 'Insufficient total stock for %. Available: %, Requested: %', 
        v_item.product_name, v_current_stock, v_item.quantity;
    END IF;

    -- C. Batch Processing (FEFO)
    v_qty_needed := v_item.quantity;
    
    -- Loop through batches for this product, ordered by expiry (and then created_at)
    -- We assume created_at or id helps tie break. 
    FOR v_batch IN 
      SELECT * FROM public.inventory_batches
      WHERE inventory_id = v_item.product_id AND quantity > 0
      ORDER BY expiry_date ASC, created_at ASC
      FOR UPDATE
    LOOP
      EXIT WHEN v_qty_needed <= 0;

      -- Compliance Check: Is this batch expired?
      IF v_batch.expiry_date < CURRENT_DATE THEN
         -- Strict Mode: If the EARLIEST available batch is expired, we block the sale.
         -- This prevents selling expired goods even if valid goods exist later (because you should have disposed of expired goods).
         -- However, practically, maybe we skip it? 
         -- "Strict Pre-Delivery Review" says: Prevention of selling expired drugs.
         RAISE EXCEPTION 'Critical Safety Error: Batch % for % is EXPIRED (%). Cannot sell.', 
            v_batch.batch_number, v_item.product_name, v_batch.expiry_date;
      END IF;

      -- Determine how much to take from this batch
      IF v_batch.quantity >= v_qty_needed THEN
        v_qty_to_deduct := v_qty_needed;
      ELSE
        v_qty_to_deduct := v_batch.quantity;
      END IF;

      -- Deduct from Batch
      UPDATE public.inventory_batches
      SET quantity = quantity - v_qty_to_deduct
      WHERE id = v_batch.id;

      -- Log Batch Movement
      INSERT INTO public.stock_movements (
        product_id,
        quantity_change,
        previous_quantity,
        new_quantity,
        type,
        reason,
        reference_id,
        created_by,
        batch_number -- We trace specific batch
      ) VALUES (
        v_item.product_id,
        -v_qty_to_deduct,
        v_batch.quantity,
        v_batch.quantity - v_qty_to_deduct,
        'SALE',
        'Sale Transaction ' || p_transaction_id || ' (Batch ' || v_batch.batch_number || ')',
        v_sale_id,
        p_cashier_id,
        v_batch.batch_number
      );

      v_qty_needed := v_qty_needed - v_qty_to_deduct;
    END LOOP;

    -- If after strict batch loop we still need qty (e.g. some stock was in 'null' batch or phantom stock not in inventory_batches)
    -- We must decide: Fail or Allow deduction from Master only?
    -- For "Production Ready", we should rely on Batches if they exist.
    -- If v_qty_needed > 0, it means Inventory total > Sum(Batches).
    -- We will deduct the remainder from the Master Inventory record directly (and log it as 'Unspecified Batch').
    
    -- D. Deduct from Master Inventory (Atomic SQL Update)
    -- Note: If we used the Trigger approach (summing batches), updating batches above would auto-update Master.
    -- BUT, we rely on specific movement logging. 
    -- Let's update Master to be safe/consistent with v_current_stock logic.
    UPDATE public.inventory
    SET 
      quantity = quantity - v_item.quantity,
      last_updated_at = NOW(),
      last_updated_by = p_cashier_id
    WHERE id = v_item.product_id;

    -- E. Record Sale Item
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

    -- Calculate total cost for profit tracking
    v_total_cost := v_total_cost + (COALESCE(v_cost_price, 0) * v_item.quantity);
  END LOOP;

  -- 3. Calculate Final Profit
  v_gross_profit := p_total - v_total_cost;

  -- 4. Log Audit Event
  PERFORM public.log_audit_event(
    'SALE_COMPLETED',
    p_cashier_id,
    p_cashier_email,
    'DISPENSER',
    'Sale processed with FEFO Batch Tracking',
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
  RAISE;
END;
$$;

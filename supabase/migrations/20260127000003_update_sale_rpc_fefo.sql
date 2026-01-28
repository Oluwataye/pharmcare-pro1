-- Migration: Update Sales Transaction to use Batches (FEFO)

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
  v_batch RECORD;
  v_remaining_qty INTEGER;
  v_qty_to_deduct INTEGER;
  v_total_available INTEGER;
  v_total_cost DECIMAL := 0;
  v_item_cost DECIMAL;
  v_gross_profit DECIMAL;
  v_result JSONB;
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
    -- A. Check Global Availability (Simple check before complex batch logic)
    SELECT SUM(quantity) INTO v_total_available
    FROM public.inventory_batches
    WHERE inventory_id = v_item.product_id
      AND expiry_date >= CURRENT_DATE; -- Only count valid stock!
    
    IF v_total_available IS NULL OR v_total_available < v_item.quantity THEN
      RAISE EXCEPTION 'Insufficient VALID (non-expired) stock for %. Requested: %, Available: %', 
        v_item.product_name, v_item.quantity, COALESCE(v_total_available, 0);
    END IF;

    -- B. FEFO Logic: Deduct from batches starting with earliest expiry
    v_remaining_qty := v_item.quantity;
    v_item_cost := 0;

    FOR v_batch IN 
      SELECT id, quantity, cost_price, expiry_date, batch_number
      FROM public.inventory_batches
      WHERE inventory_id = v_item.product_id
        AND quantity > 0
        AND expiry_date >= CURRENT_DATE
      ORDER BY expiry_date ASC, created_at ASC
      FOR UPDATE -- Lock these query rows
    LOOP
      IF v_remaining_qty <= 0 THEN
        EXIT;
      END IF;

      -- Determine how much to take from this batch
      IF v_batch.quantity >= v_remaining_qty THEN
        v_qty_to_deduct := v_remaining_qty;
      ELSE
        v_qty_to_deduct := v_batch.quantity;
      END IF;

      -- Update batch
      UPDATE public.inventory_batches
      SET quantity = quantity - v_qty_to_deduct,
          updated_at = NOW()
      WHERE id = v_batch.id;

      -- Accumulate cost (weighted average cost calculation could happen here, but we sum up totals)
      v_item_cost := v_item_cost + (COALESCE(v_batch.cost_price, 0) * v_qty_to_deduct);

      -- Log the specific batch usage (Optional: Create a sales_batch_items table for traceability)
      -- For now, we just decrement. Traceability can be added to stock_movements.
      
      -- Add movement record for this specific batch
      INSERT INTO public.stock_movements (
        product_id,
        quantity_change,
        previous_quantity,
        new_quantity,
        type,
        reason,
        reference_id,
        created_by,
        batch_number -- We need to add this column to stock_movements if not exists, for now put in reason
      ) VALUES (
        v_item.product_id,
        -v_qty_to_deduct,
        v_batch.quantity,
        v_batch.quantity - v_qty_to_deduct,
        'SALE',
        'Sale ' || p_transaction_id || ' (Batch: ' || v_batch.batch_number || ')',
        v_sale_id,
        p_cashier_id,
        v_batch.batch_number -- Will fail if column doesn't exist, will add in next step
      );

      v_remaining_qty := v_remaining_qty - v_qty_to_deduct;
    END LOOP;

    -- Double check if we fulfilled the order (Should be caught by initial check, but safety first)
    IF v_remaining_qty > 0 THEN
      RAISE EXCEPTION 'Concurrency Error: Stock changed during processing for %', v_item.product_name;
    END IF;

    -- C. Record Sale Item
    INSERT INTO public.sales_items (
      sale_id,
      product_id,
      product_name,
      quantity,
      unit_price,
      price,
      cost_price, -- This is now the accurate weighted cost from the specific batches used
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
      (v_item_cost / v_item.quantity), -- Average unit cost for this line item
      COALESCE(v_item.discount, 0),
      v_item.is_wholesale,
      v_item.total
    );

    v_total_cost := v_total_cost + v_item_cost;
  END LOOP;

  -- 3. Calculate Final Profit
  v_gross_profit := p_total - v_total_cost;

  -- 4. Log Audit Event
  PERFORM public.log_audit_event(
    'SALE_COMPLETED',
    p_cashier_id,
    p_cashier_email,
    'DISPENSER',
    'Sale processed with FEFO BATCH LOGIC',
    'sales',
    v_sale_id::text,
    jsonb_build_object(
      'transactionId', p_transaction_id,
      'total', p_total,
      'profit', v_gross_profit,
      'items', jsonb_array_length(p_items)
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

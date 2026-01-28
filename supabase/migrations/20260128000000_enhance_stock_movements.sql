
-- Migration: Enhance Stock Movements for Financial Auditing
-- This migration adds price columns to stock_movements to ensure historical financial impact can be calculated accurately.

-- 1. Add price columns to stock_movements
ALTER TABLE public.stock_movements
ADD COLUMN IF NOT EXISTS cost_price_at_time DECIMAL,
ADD COLUMN IF NOT EXISTS unit_price_at_time DECIMAL;

-- 2. Update process_sale_transaction RPC to include prices in stock_movements
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
  v_unit_price DECIMAL;
  v_total_cost DECIMAL := 0;
  v_gross_profit DECIMAL;
  v_result JSONB;
  
  -- Variables for batch processing
  v_batch RECORD;
  v_qty_needed INTEGER;
  v_qty_to_deduct INTEGER;
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
    SELECT quantity, cost_price, price INTO v_current_stock, v_cost_price, v_unit_price
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
    
    FOR v_batch IN 
      SELECT * FROM public.inventory_batches
      WHERE inventory_id = v_item.product_id AND quantity > 0
      ORDER BY expiry_date ASC, created_at ASC
      FOR UPDATE
    LOOP
      EXIT WHEN v_qty_needed <= 0;

      -- Compliance Check: Is this batch expired?
      IF v_batch.expiry_date < CURRENT_DATE THEN
          RAISE EXCEPTION 'Critical Safety Error: Batch % for % is EXPIRED (%). Cannot sell.', 
            v_batch.batch_number, v_item.product_name, v_batch.expiry_date;
      END IF;

      IF v_batch.quantity >= v_qty_needed THEN
        v_qty_to_deduct := v_qty_needed;
      ELSE
        v_qty_to_deduct := v_batch.quantity;
      END IF;

      -- Deduct from Batch
      UPDATE public.inventory_batches
      SET quantity = quantity - v_qty_to_deduct
      WHERE id = v_batch.id;

      -- Log Batch Movement with Prices
      INSERT INTO public.stock_movements (
        product_id,
        quantity_change,
        previous_quantity,
        new_quantity,
        type,
        reason,
        reference_id,
        created_by,
        batch_number,
        cost_price_at_time,
        unit_price_at_time
      ) VALUES (
        v_item.product_id,
        -v_qty_to_deduct,
        v_batch.quantity,
        v_batch.quantity - v_qty_to_deduct,
        'SALE',
        'Sale Transaction ' || p_transaction_id || ' (Batch ' || v_batch.batch_number || ')',
        v_sale_id,
        p_cashier_id,
        v_batch.batch_number,
        COALESCE(v_batch.cost_price, v_cost_price), -- Prefer batch cost
        COALESCE(v_item.unit_price, v_unit_price) -- Use actual sale unit price
      );

      v_qty_needed := v_qty_needed - v_qty_to_deduct;
    END LOOP;

    -- D. Deduct from Master Inventory
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

-- 3. Update add_new_inventory_item RPC to include prices in stock_movements
CREATE OR REPLACE FUNCTION public.add_new_inventory_item(
    p_name TEXT,
    p_sku TEXT,
    p_category TEXT,
    p_quantity INTEGER,
    p_unit TEXT,
    p_price DECIMAL,
    p_cost_price DECIMAL,
    p_reorder_level INTEGER,
    p_expiry_date DATE,
    p_manufacturer TEXT,
    p_batch_number TEXT,
    p_supplier_id UUID,
    p_restock_invoice_number TEXT,
    p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_inventory_id UUID;
    v_batch_id UUID;
    v_result JSONB;
BEGIN
    -- 1. Insert into inventory (Master Record)
    INSERT INTO public.inventory (
        name,
        sku,
        category,
        quantity,
        unit,
        price,
        cost_price,
        reorder_level,
        expiry_date,
        manufacturer,
        batch_number,
        supplier_id,
        restock_invoice_number,
        last_updated_by
    ) VALUES (
        p_name,
        p_sku,
        p_category,
        p_quantity,
        p_unit,
        p_price,
        p_cost_price,
        p_reorder_level,
        p_expiry_date,
        p_manufacturer,
        p_batch_number,
        p_supplier_id,
        p_restock_invoice_number,
        p_user_id
    )
    RETURNING id INTO v_inventory_id;

    -- 2. Insert into inventory_batches
    INSERT INTO public.inventory_batches (
        inventory_id,
        batch_number,
        expiry_date,
        quantity,
        cost_price
    ) VALUES (
        v_inventory_id,
        p_batch_number,
        p_expiry_date,
        p_quantity,
        p_cost_price
    )
    RETURNING id INTO v_batch_id;

    -- 3. Log Stock Movement with Prices
    INSERT INTO public.stock_movements (
        product_id,
        quantity_change,
        previous_quantity,
        new_quantity,
        type,
        reason,
        created_by,
        batch_number,
        cost_price_at_time,
        unit_price_at_time
    ) VALUES (
        v_inventory_id,
        p_quantity,
        0,
        p_quantity,
        'INITIAL',
        CASE WHEN p_restock_invoice_number IS NOT NULL 
             THEN 'Initial stock entry - Invoice: ' || p_restock_invoice_number
             ELSE 'Initial stock entry'
        END,
        p_user_id,
        p_batch_number,
        p_cost_price,
        p_price
    );

    v_result := jsonb_build_object(
        'success', true,
        'id', v_inventory_id,
        'batch_id', v_batch_id
    );

    RETURN v_result;
END;
$$;

-- 4. Add comment
COMMENT ON COLUMN public.stock_movements.cost_price_at_time IS 'Unit cost price at the time of movement for financial auditing.';
COMMENT ON COLUMN public.stock_movements.unit_price_at_time IS 'Unit selling price at the time of movement for financial auditing.';

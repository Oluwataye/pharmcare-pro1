-- Migration: Add Expiry Date Enforcement and Stock Validation to Sales
-- Priority: CRITICAL - Patient Safety & Inventory Integrity
-- Description: Prevents sale of expired drugs and negative inventory at database level
-- Version: 2.0 (Enhanced with comprehensive validations)
-- Date: 2026-02-09

CREATE OR REPLACE FUNCTION public.process_sale_transaction(p_payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sale_id UUID;
  v_item JSONB;
  v_payment JSONB;
  v_current_stock INTEGER;
  v_cost_price DECIMAL;
  v_expiry_date DATE;
  v_total_cost DECIMAL := 0;
BEGIN
  -- 1. Insert Master Sale Record
  INSERT INTO public.sales (
    transaction_id, total, discount, manual_discount, 
    customer_name, customer_phone, business_name, business_address, 
    sale_type, status, cashier_id, cashier_name, cashier_email, 
    shift_name, shift_id, staff_role, payment_methods,
    payment_status, amount_paid, amount_outstanding, customer_id
  ) VALUES (
    (p_payload->>'p_transaction_id'),
    (p_payload->>'p_total')::DECIMAL,
    COALESCE((p_payload->>'p_discount')::DECIMAL, 0),
    COALESCE((p_payload->>'p_manual_discount')::DECIMAL, 0),
    (p_payload->>'p_customer_name'),
    (p_payload->>'p_customer_phone'),
    (p_payload->>'p_business_name'),
    (p_payload->>'p_business_address'),
    (p_payload->>'p_sale_type'),
    'completed',
    (p_payload->>'p_cashier_id')::UUID,
    (p_payload->>'p_cashier_name'),
    (p_payload->>'p_cashier_email'),
    (p_payload->>'p_shift_name'),
    CASE 
      WHEN (p_payload->>'p_shift_id') IS NOT NULL AND (p_payload->>'p_shift_id') != '' 
      THEN (p_payload->>'p_shift_id')::UUID 
      ELSE NULL 
    END,
    (p_payload->>'p_staff_role'),
    (p_payload->'p_payments'),
    COALESCE((p_payload->>'p_payment_status'), 'paid'),
    COALESCE((p_payload->>'p_amount_paid')::DECIMAL, 0),
    COALESCE((p_payload->>'p_amount_outstanding')::DECIMAL, 0),
    CASE 
      WHEN (p_payload->>'p_customer_id') IS NOT NULL AND (p_payload->>'p_customer_id') != '' 
      THEN (p_payload->>'p_customer_id')::UUID 
      ELSE NULL 
    END
  ) RETURNING id INTO v_sale_id;

  -- 2. Process Items with CRITICAL VALIDATIONS
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_payload->'p_items') LOOP
    -- Fetch current stock, cost price, AND expiry date with row lock
    SELECT quantity, cost_price, expiry_date 
    INTO v_current_stock, v_cost_price, v_expiry_date
    FROM public.inventory 
    WHERE id = (v_item->>'product_id')::UUID 
    FOR UPDATE;

    -- ✅ CRITICAL VALIDATION #1: Product exists
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product not found: % (ID: %)', 
        v_item->>'product_name', 
        v_item->>'product_id';
    END IF;

    -- ✅ CRITICAL VALIDATION #2: Expiry date enforcement (PATIENT SAFETY)
    IF v_expiry_date IS NOT NULL AND v_expiry_date <= CURRENT_DATE THEN
      RAISE EXCEPTION 'Cannot sell expired product: % (expired on %)', 
        v_item->>'product_name', 
        v_expiry_date;
    END IF;

    -- ✅ CRITICAL VALIDATION #3: Stock availability (INVENTORY INTEGRITY)
    IF v_current_stock < (v_item->>'quantity')::INTEGER THEN
      RAISE EXCEPTION 'Insufficient stock for "%": requested %, available %', 
        v_item->>'product_name', 
        (v_item->>'quantity')::INTEGER,
        v_current_stock;
    END IF;

    -- Deduct Stock (only after ALL validations pass)
    UPDATE public.inventory SET 
      quantity = quantity - (v_item->>'quantity')::INTEGER,
      last_updated_at = NOW(),
      last_updated_by = (p_payload->>'p_cashier_id')::UUID
    WHERE id = (v_item->>'product_id')::UUID;

    -- Insert Sale Item
    INSERT INTO public.sales_items (
      sale_id, product_id, product_name, quantity, unit_price, price, cost_price, discount, is_wholesale, total
    ) VALUES (
      v_sale_id, 
      (v_item->>'product_id')::UUID, 
      v_item->>'product_name', 
      (v_item->>'quantity')::INTEGER, 
      (v_item->>'unit_price')::DECIMAL, 
      (v_item->>'price')::DECIMAL,
      COALESCE(v_cost_price, 0), 
      COALESCE((v_item->>'discount')::DECIMAL, 0),
      COALESCE((v_item->>'is_wholesale')::BOOLEAN, false), 
      (v_item->>'total')::DECIMAL
    );

    -- Calculate total cost for profit calculation
    v_total_cost := v_total_cost + (COALESCE(v_cost_price, 0) * (v_item->>'quantity')::INTEGER);
  END LOOP;

  -- 3. Record Payments
  FOR v_payment IN SELECT * FROM jsonb_array_elements(p_payload->'p_payments') LOOP
    INSERT INTO public.sale_payments (sale_id, payment_mode, amount)
    VALUES (v_sale_id, v_payment->>'mode', (v_payment->>'amount')::DECIMAL);
  END LOOP;

  -- 4. Return Success with Profit Calculation
  RETURN jsonb_build_object(
    'success', true, 
    'sale_id', v_sale_id, 
    'transaction_id', p_payload->>'p_transaction_id',
    'profit', ((p_payload->>'p_total')::DECIMAL - v_total_cost)
  );

EXCEPTION 
  WHEN OTHERS THEN
    -- Re-raise with context for debugging
    RAISE EXCEPTION 'Sale transaction failed: %', SQLERRM;
END;
$$;

-- Add documentation comment
COMMENT ON FUNCTION public.process_sale_transaction IS 
'Processes sale transactions with CRITICAL validations:
1. Expiry date enforcement (patient safety)
2. Stock availability check (inventory integrity)
3. Product existence validation
Updated: 2026-02-09 for production safety compliance.';

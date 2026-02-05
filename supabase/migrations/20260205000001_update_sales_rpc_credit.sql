-- Migration: Update Sales RPC for Credit Support
-- Description: Updates process_sale_transaction to accept payment status and amount details.

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
  p_payments JSONB DEFAULT '[{"mode": "cash", "amount": 0}]'::jsonb,
  p_shift_name TEXT DEFAULT NULL,
  p_shift_id TEXT DEFAULT NULL,
  p_staff_role TEXT DEFAULT NULL,
  -- NEW PARAMETERS
  p_payment_status TEXT DEFAULT 'paid',
  p_amount_paid DECIMAL DEFAULT 0,
  p_amount_outstanding DECIMAL DEFAULT 0,
  p_customer_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sale_id UUID;
  v_item JSONB;
  v_payment JSONB;
BEGIN
  -- 1. Insert into Sales Table
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
    staff_role,
    payment_methods,
    -- NEW COLUMNS
    payment_status,
    amount_paid,
    amount_outstanding,
    customer_id
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
    p_staff_role,
    p_payments,
    p_payment_status,
    p_amount_paid,
    p_amount_outstanding,
    p_customer_id
  )
  RETURNING id INTO v_sale_id;

  -- 2. Insert Sales Items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO public.sales_items (
      sale_id,
      product_id,
      product_name,
      quantity,
      unit_price,
      price,
      discount,
      is_wholesale,
      total
    ) VALUES (
      v_sale_id,
      (v_item->>'product_id')::UUID,
      v_item->>'product_name',
      (v_item->>'quantity')::INTEGER,
      (v_item->>'unit_price')::DECIMAL,
      (v_item->>'price')::DECIMAL,
      COALESCE((v_item->>'discount')::DECIMAL, 0),
      COALESCE((v_item->>'is_wholesale')::BOOLEAN, false),
      (v_item->>'total')::DECIMAL
    );

    -- 3. Update Inventory (Decrement Stock)
    UPDATE public.inventory
    SET quantity = quantity - (v_item->>'quantity')::INTEGER,
        last_updated_at = NOW()
    WHERE id = (v_item->>'product_id')::UUID;
  END LOOP;

  -- 4. Record Payments (Separate Table)
  FOR v_payment IN SELECT * FROM jsonb_array_elements(p_payments)
  LOOP
     INSERT INTO public.sale_payments (
       sale_id,
       payment_mode,
       amount
     ) VALUES (
       v_sale_id,
       v_payment->>'mode',
       (v_payment->>'amount')::DECIMAL
     );
  END LOOP;

  -- Return success
  RETURN jsonb_build_object(
    'success', true,
    'sale_id', v_sale_id,
    'transaction_id', p_transaction_id
  );

EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Transaction failed: %', SQLERRM;
END;
$$;

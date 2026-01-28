
-- CONSOLIDATED MIGRATION: Stock Management & Auditing
-- Run this single script to set up all tables and functions in the correct order.

-- 1. Fix handle_updated_at function mismatch if it exists
-- This function might be trying to update 'updated_at' on tables that use 'last_updated_at'
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check for updated_at column
    BEGIN
        NEW.updated_at = NOW();
    EXCEPTION WHEN others THEN
        -- If updated_at fails, try last_updated_at
        BEGIN
            NEW.last_updated_at = NOW();
        EXCEPTION WHEN others THEN
            NULL; -- Skip if neither exists
        END;
    END;
    RETURN NEW;
END;
$$;

-- 2. Create Stock Movement Type Enum
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'stock_movement_type') THEN
        CREATE TYPE public.stock_movement_type AS ENUM ('SALE', 'ADJUSTMENT', 'ADDITION', 'RETURN', 'INITIAL');
    END IF;
END $$;

-- 2. Create Stock Movements Table
CREATE TABLE IF NOT EXISTS public.stock_movements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id uuid NOT NULL REFERENCES public.inventory(id) ON DELETE CASCADE,
    quantity_change integer NOT NULL,
    previous_quantity integer NOT NULL,
    new_quantity integer NOT NULL,
    type public.stock_movement_type NOT NULL,
    reason text,
    reference_id uuid,
    created_by uuid REFERENCES auth.users(id),
    created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Create Inventory Batches Table
CREATE TABLE IF NOT EXISTS public.inventory_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_id UUID NOT NULL REFERENCES public.inventory(id) ON DELETE CASCADE,
    batch_number TEXT NOT NULL,
    expiry_date DATE NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    cost_price DECIMAL(10,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT quantity_not_negative CHECK (quantity >= 0)
);

-- 4. Sync function for Inventory Totals
CREATE OR REPLACE FUNCTION public.sync_inventory_quantity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    WITH batch_totals AS (
        SELECT inventory_id, SUM(quantity) as total_qty
        FROM public.inventory_batches
        WHERE inventory_id = COALESCE(NEW.inventory_id, OLD.inventory_id)
        GROUP BY inventory_id
    )
    UPDATE public.inventory
    SET quantity = COALESCE((SELECT total_qty FROM batch_totals), 0),
        last_updated_at = NOW()
    WHERE id = COALESCE(NEW.inventory_id, OLD.inventory_id);
    
    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_inventory_quantity ON public.inventory_batches;
CREATE TRIGGER trg_sync_inventory_quantity
AFTER INSERT OR UPDATE OR DELETE ON public.inventory_batches
FOR EACH ROW
EXECUTE FUNCTION public.sync_inventory_quantity();

-- 5. Add Enhanced Columns to Stock Movements
ALTER TABLE public.stock_movements
ADD COLUMN IF NOT EXISTS batch_number TEXT,
ADD COLUMN IF NOT EXISTS expiry_date DATE,
ADD COLUMN IF NOT EXISTS cost_price_at_time DECIMAL,
ADD COLUMN IF NOT EXISTS unit_price_at_time DECIMAL;

-- 6. Atomic Add Inventory Function
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
    INSERT INTO public.inventory (
        name, sku, category, quantity, unit, price, cost_price, 
        reorder_level, expiry_date, manufacturer, batch_number, 
        supplier_id, restock_invoice_number, last_updated_by
    ) VALUES (
        p_name, p_sku, p_category, p_quantity, p_unit, p_price, p_cost_price, 
        p_reorder_level, p_expiry_date, p_manufacturer, p_batch_number, 
        p_supplier_id, p_restock_invoice_number, p_user_id
    )
    RETURNING id INTO v_inventory_id;

    INSERT INTO public.inventory_batches (
        inventory_id, batch_number, expiry_date, quantity, cost_price
    ) VALUES (
        v_inventory_id, p_batch_number, p_expiry_date, p_quantity, p_cost_price
    )
    RETURNING id INTO v_batch_id;

    INSERT INTO public.stock_movements (
        product_id, quantity_change, previous_quantity, new_quantity, 
        type, reason, created_by, batch_number, cost_price_at_time, unit_price_at_time
    ) VALUES (
        v_inventory_id, p_quantity, 0, p_quantity, 
        'INITIAL', 
        CASE WHEN p_restock_invoice_number IS NOT NULL 
             THEN 'Initial stock entry - Invoice: ' || p_restock_invoice_number
             ELSE 'Initial stock entry'
        END,
        p_user_id, p_batch_number, p_cost_price, p_price
    );

    RETURN jsonb_build_object('success', true, 'id', v_inventory_id, 'batch_id', v_batch_id);
END;
$$;

-- 7. Process Sale Transaction Function (with FEFO)
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
  p_items JSONB
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
  v_batch RECORD;
  v_qty_needed INTEGER;
  v_qty_to_deduct INTEGER;
BEGIN
  INSERT INTO public.sales (
    transaction_id, total, discount, manual_discount, customer_name, 
    customer_phone, business_name, business_address, sale_type, 
    status, cashier_id, cashier_name, cashier_email
  ) VALUES (
    p_transaction_id, p_total, p_discount, p_manual_discount, p_customer_name, 
    p_customer_phone, p_business_name, p_business_address, p_sale_type, 
    'completed', p_cashier_id, p_cashier_name, p_cashier_email
  )
  RETURNING id INTO v_sale_id;

  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(
    product_id UUID, product_name TEXT, quantity INTEGER, unit_price DECIMAL, 
    price DECIMAL, discount DECIMAL, is_wholesale BOOLEAN, total DECIMAL
  )
  LOOP
    SELECT quantity, cost_price, price INTO v_current_stock, v_cost_price, v_unit_price
    FROM public.inventory WHERE id = v_item.product_id FOR UPDATE;

    IF v_current_stock < v_item.quantity THEN
      RAISE EXCEPTION 'Insufficient stock for %', v_item.product_name;
    END IF;

    v_qty_needed := v_item.quantity;
    FOR v_batch IN 
      SELECT * FROM public.inventory_batches
      WHERE inventory_id = v_item.product_id AND quantity > 0
      ORDER BY expiry_date ASC, created_at ASC FOR UPDATE
    LOOP
      EXIT WHEN v_qty_needed <= 0;
      IF v_batch.expiry_date < CURRENT_DATE THEN
          RAISE EXCEPTION 'Batch % for % is EXPIRED', v_batch.batch_number, v_item.product_name;
      END IF;

      v_qty_to_deduct := LEAST(v_batch.quantity, v_qty_needed);

      UPDATE public.inventory_batches SET quantity = quantity - v_qty_to_deduct WHERE id = v_batch.id;

      INSERT INTO public.stock_movements (
        product_id, quantity_change, previous_quantity, new_quantity, 
        type, reason, reference_id, created_by, batch_number, 
        cost_price_at_time, unit_price_at_time
      ) VALUES (
        v_item.product_id, -v_qty_to_deduct, v_batch.quantity, v_batch.quantity - v_qty_to_deduct,
        'SALE', 'Sale ' || p_transaction_id, v_sale_id, p_cashier_id, v_batch.batch_number,
        COALESCE(v_batch.cost_price, v_cost_price), COALESCE(v_item.unit_price, v_unit_price)
      );

      v_qty_needed := v_qty_needed - v_qty_to_deduct;
    END LOOP;

    UPDATE public.inventory SET quantity = quantity - v_item.quantity, last_updated_at = NOW() WHERE id = v_item.product_id;

    INSERT INTO public.sales_items (
      sale_id, product_id, product_name, quantity, unit_price, price, cost_price, discount, is_wholesale, total
    ) VALUES (
      v_sale_id, v_item.product_id, v_item.product_name, v_item.quantity, 
      v_item.unit_price, v_item.price, COALESCE(v_cost_price, 0), 
      COALESCE(v_item.discount, 0), v_item.is_wholesale, v_item.total
    );

    v_total_cost := v_total_cost + (COALESCE(v_cost_price, 0) * v_item.quantity);
  END LOOP;

  RETURN jsonb_build_object('success', true, 'sale_id', v_sale_id, 'profit', p_total - v_total_cost);
END;
$$;

-- 8. Fix API Relationships
ALTER TABLE public.stock_movements DROP CONSTRAINT IF EXISTS stock_movements_created_by_profiles_fkey;
ALTER TABLE public.stock_movements ADD CONSTRAINT stock_movements_created_by_profiles_fkey 
FOREIGN KEY (created_by) REFERENCES public.profiles(user_id);

ALTER TABLE public.inventory DROP CONSTRAINT IF EXISTS inventory_last_updated_by_profiles_fkey;
ALTER TABLE public.inventory ADD CONSTRAINT inventory_last_updated_by_profiles_fkey 
FOREIGN KEY (last_updated_by) REFERENCES public.profiles(user_id);

-- 9. Setup RLS
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_batches ENABLE ROW LEVEL SECURITY;

-- 10. Initial Data Migration (Move Master stock to Legacy Batch)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT id, quantity, cost_price FROM public.inventory WHERE quantity > 0 LOOP
        IF NOT EXISTS (SELECT 1 FROM public.inventory_batches WHERE inventory_id = r.id) THEN
            INSERT INTO public.inventory_batches (inventory_id, batch_number, expiry_date, quantity, cost_price)
            VALUES (r.id, 'LEGACY_STOCK', (CURRENT_DATE + INTERVAL '5 years')::DATE, r.quantity, r.cost_price);
        END IF;
    END LOOP;
END $$;

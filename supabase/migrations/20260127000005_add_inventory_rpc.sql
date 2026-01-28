-- Migration: Atomic Add Inventory Item with Batch

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
    -- Note: We initially set quantity to 0 or p_quantity? 
    -- If we set to 0, the trigger on batch insert will update it to p_quantity. 
    -- If we set to p_quantity, the trigger will update it to p_quantity (no change).
    -- Let's set it to p_quantity for clarity, trigger will confirm it.
    
    INSERT INTO public.inventory (
        name,
        sku,
        category,
        quantity,
        unit,
        price,
        cost_price,
        reorder_level,
        expiry_date, -- Earliest expiry (same as batch for new item)
        manufacturer,
        batch_number, -- Earliest batch (same as batch for new item)
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

    -- 3. Log Stock Movement
    INSERT INTO public.stock_movements (
        product_id,
        quantity_change,
        previous_quantity,
        new_quantity,
        type,
        reason,
        created_by,
        batch_number
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
        p_batch_number
    );

    v_result := jsonb_build_object(
        'success', true,
        'id', v_inventory_id,
        'batch_id', v_batch_id
    );

    RETURN v_result;
END;
$$;

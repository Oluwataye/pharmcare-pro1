-- Migration: Add Inventory Batches and Expiry Tracking

-- 1. Create the inventory_batches table
CREATE TABLE IF NOT EXISTS public.inventory_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_id UUID NOT NULL REFERENCES public.inventory(id) ON DELETE CASCADE,
    batch_number TEXT NOT NULL,
    expiry_date DATE NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    cost_price DECIMAL(10,2), -- Optional: Track cost per batch if different
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT quantity_not_negative CHECK (quantity >= 0)
);

-- 2. Create Indexes for Performance (FEFO lookup)
CREATE INDEX idx_inventory_batches_inventory_id ON public.inventory_batches(inventory_id);
CREATE INDEX idx_inventory_batches_expiry ON public.inventory_batches(expiry_date ASC);

-- 3. Enable RLS
ALTER TABLE public.inventory_batches ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow authenticated to read batches"
ON public.inventory_batches FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated to manage batches"
ON public.inventory_batches FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 4. Automatic Inventory Total Sync Trigger
-- We want inventory.quantity to ALWAYS reflect the sum of batches.
-- This prevents drift between the "Master" record and the "Details".

CREATE OR REPLACE FUNCTION public.sync_inventory_quantity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Update the parent inventory item's total quantity
    -- We calculate the sum of all batches for the affected inventory_id
    WITH batch_totals AS (
        SELECT inventory_id, SUM(quantity) as total_qty
        FROM public.inventory_batches
        WHERE inventory_id = COALESCE(NEW.inventory_id, OLD.inventory_id)
        GROUP BY inventory_id
    )
    UPDATE public.inventory
    SET quantity = COALESCE((SELECT total_qty FROM batch_totals), 0),
        updated_at = NOW()
    WHERE id = COALESCE(NEW.inventory_id, OLD.inventory_id);
    
    RETURN NULL; -- Return value ignored for AFTER triggers
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_inventory_quantity ON public.inventory_batches;

CREATE TRIGGER trg_sync_inventory_quantity
AFTER INSERT OR UPDATE OR DELETE ON public.inventory_batches
FOR EACH ROW
EXECUTE FUNCTION public.sync_inventory_quantity();

-- 5. Data Migration: Move existing stock to "LEGACY" batches
-- This ensures valid sales can continue immediately after migration.
-- We use a future expiry date (5 years from now) as a placeholder.

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT id, quantity, cost_price FROM public.inventory WHERE quantity > 0 LOOP
        -- check if batches already exist to avoid double migration if run twice
        IF NOT EXISTS (SELECT 1 FROM public.inventory_batches WHERE inventory_id = r.id) THEN
            INSERT INTO public.inventory_batches (
                inventory_id, 
                batch_number, 
                expiry_date, 
                quantity,
                cost_price
            ) VALUES (
                r.id, 
                'LEGACY_STOCK', 
                (CURRENT_DATE + INTERVAL '5 years')::DATE, 
                r.quantity,
                r.cost_price
            );
        END IF;
    END LOOP;
END $$;

-- 6. Add "low_stock_threshold" to inventory if missing (useful for alerts)
ALTER TABLE public.inventory 
ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER DEFAULT 10;

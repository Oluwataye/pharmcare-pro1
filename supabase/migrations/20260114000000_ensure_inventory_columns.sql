
-- Migration: Ensure Inventory Columns and Enable Realtime

-- 1. Ensure cost_price exists
ALTER TABLE public.inventory 
ADD COLUMN IF NOT EXISTS cost_price decimal(10,2) DEFAULT 0;

-- 2. Ensure supplier_id exists and references suppliers table
-- First check if we have a suppliers table, if not create a minimal one for references
CREATE TABLE IF NOT EXISTS public.suppliers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    email text,
    phone text,
    address text,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.inventory 
ADD COLUMN IF NOT EXISTS supplier_id uuid REFERENCES public.suppliers(id) ON DELETE SET NULL;

-- 3. Ensure restock_invoice_number exists
ALTER TABLE public.inventory 
ADD COLUMN IF NOT EXISTS restock_invoice_number text;

-- 4. Enable Realtime for inventory table
-- First check if the publication exists, if not create it
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
END $$;

-- Add inventory to the publication
ALTER PUBLICATION supabase_realtime ADD TABLE inventory;

-- 5. Add comments for clarity
COMMENT ON COLUMN public.inventory.cost_price IS 'The purchase price of the item from the supplier.';
COMMENT ON COLUMN public.inventory.supplier_id IS 'Reference to the supplier of the most recent stock.';
COMMENT ON COLUMN public.inventory.restock_invoice_number IS 'Reference number for the most recent restock event.';

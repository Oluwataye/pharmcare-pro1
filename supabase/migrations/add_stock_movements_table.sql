
-- Migration: Add Stock Movements Table for Inventory Audit Trail

-- 1. Create the Movement Type Enum
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'stock_movement_type') THEN
        CREATE TYPE public.stock_movement_type AS ENUM ('SALE', 'ADJUSTMENT', 'ADDITION', 'RETURN', 'INITIAL');
    END IF;
END $$;

-- 2. Create the Stock Movements Table
CREATE TABLE IF NOT EXISTS public.stock_movements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id uuid NOT NULL REFERENCES public.inventory(id) ON DELETE CASCADE,
    quantity_change integer NOT NULL,
    previous_quantity integer NOT NULL,
    new_quantity integer NOT NULL,
    type public.stock_movement_type NOT NULL,
    reason text,
    reference_id uuid, -- Can be Sale ID or other reference
    created_by uuid REFERENCES auth.users(id),
    created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Add Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON public.stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON public.stock_movements(created_at);
CREATE INDEX IF NOT EXISTS idx_stock_movements_type ON public.stock_movements(type);

-- 4. Enable Row Level Security
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS Policies
CREATE POLICY "Users can view stock movements"
    ON public.stock_movements FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins and Pharmacists can create movements"
    ON public.stock_movements FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_roles
            WHERE user_id = auth.uid()
            AND role IN ('SUPER_ADMIN', 'PHARMACIST')
        ) 
        OR 
        (type = 'SALE') -- Sales can be logged by anyone (including Dispensers)
    );

-- 6. Add comment for documentation
COMMENT ON TABLE public.stock_movements IS 'Audit trail for all changes to inventory stock levels';

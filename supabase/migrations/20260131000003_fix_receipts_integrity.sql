-- Migration: Fix Receipts Integrity
-- Add UNIQUE constraint to sale_id to ensure 1:1 relationship with sales
ALTER TABLE public.receipts
ADD CONSTRAINT receipts_sale_id_unique UNIQUE (sale_id);

-- Update RLS Policies for receipts to be more robust
DROP POLICY IF EXISTS "Authenticated users can insert receipts" ON public.receipts;

CREATE POLICY "Authenticated users can insert receipts"
  ON public.receipts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sales
      WHERE sales.id = receipts.sale_id
      AND (sales.cashier_id = auth.uid() OR public.has_role(auth.uid(), 'SUPER_ADMIN'::app_role))
    )
  );

-- Ensure service role can always manage receipts (usually handled by Supabase, but explicit for clarity)
ALTER TABLE public.receipts FORCE ROW LEVEL SECURITY;

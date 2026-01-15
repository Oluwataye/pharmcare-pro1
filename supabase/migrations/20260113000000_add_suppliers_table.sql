-- Create suppliers table
CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for suppliers table
-- Allow all authenticated users to read suppliers
CREATE POLICY "Allow authenticated users to read suppliers"
  ON public.suppliers
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow SUPER_ADMIN and PHARMACIST to insert suppliers
CREATE POLICY "Allow SUPER_ADMIN and PHARMACIST to insert suppliers"
  ON public.suppliers
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'SUPER_ADMIN'::app_role) OR
    public.has_role(auth.uid(), 'PHARMACIST'::app_role)
  );

-- Allow SUPER_ADMIN and PHARMACIST to update suppliers
CREATE POLICY "Allow SUPER_ADMIN and PHARMACIST to update suppliers"
  ON public.suppliers
  FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'SUPER_ADMIN'::app_role) OR
    public.has_role(auth.uid(), 'PHARMACIST'::app_role)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'SUPER_ADMIN'::app_role) OR
    public.has_role(auth.uid(), 'PHARMACIST'::app_role)
  );

-- Allow SUPER_ADMIN to delete suppliers
CREATE POLICY "Allow SUPER_ADMIN to delete suppliers"
  ON public.suppliers
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'SUPER_ADMIN'::app_role));

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_suppliers_name ON public.suppliers(name);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_suppliers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_suppliers_updated_at
  BEFORE UPDATE ON public.suppliers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_suppliers_updated_at();

-- Create receipts table to store receipt data for reprinting
CREATE TABLE IF NOT EXISTS public.receipts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  receipt_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;

-- Create policies for receipts
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'receipts' AND policyname = 'All authenticated users can view receipts'
  ) THEN 
    CREATE POLICY "All authenticated users can view receipts" 
  ON public.receipts
    FOR SELECT
  USING (true);
  END IF; 
END
$$;

DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'receipts' AND policyname = 'Authenticated users can insert receipts'
  ) THEN 
    CREATE POLICY "Authenticated users can insert receipts" 
  ON public.receipts
    FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sales
      WHERE sales.id = receipts.sale_id
      AND sales.cashier_id = auth.uid()
    )
  );
  END IF; 
END
$$;

-- Create index on sale_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_receipts_sale_id ON public.receipts(sale_id);

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_receipts_updated_at ON public.receipts;
DROP TRIGGER IF EXISTS update_receipts_updated_at ON public.receipts;
CREATE TRIGGER update_receipts_updated_at
  BEFORE UPDATE ON public.receipts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
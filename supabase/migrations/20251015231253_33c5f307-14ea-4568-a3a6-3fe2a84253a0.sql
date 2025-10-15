-- Create sales table
CREATE TABLE IF NOT EXISTS public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id TEXT NOT NULL UNIQUE,
  total NUMERIC NOT NULL,
  discount NUMERIC DEFAULT 0,
  customer_name TEXT,
  customer_phone TEXT,
  business_name TEXT,
  business_address TEXT,
  sale_type TEXT NOT NULL DEFAULT 'retail',
  status TEXT NOT NULL DEFAULT 'completed',
  cashier_id UUID REFERENCES auth.users(id),
  cashier_name TEXT,
  cashier_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sales_items table
CREATE TABLE IF NOT EXISTS public.sales_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.inventory(id),
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price NUMERIC NOT NULL,
  price NUMERIC NOT NULL,
  discount NUMERIC DEFAULT 0,
  is_wholesale BOOLEAN DEFAULT false,
  total NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sales
CREATE POLICY "All authenticated users can view sales"
  ON public.sales FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert sales"
  ON public.sales FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = cashier_id);

-- RLS Policies for sales_items
CREATE POLICY "All authenticated users can view sales items"
  ON public.sales_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert sales items"
  ON public.sales_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sales
      WHERE sales.id = sales_items.sale_id
      AND sales.cashier_id = auth.uid()
    )
  );

-- Add trigger to update updated_at
CREATE TRIGGER handle_sales_updated_at
  BEFORE UPDATE ON public.sales
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_sales_transaction_id ON public.sales(transaction_id);
CREATE INDEX IF NOT EXISTS idx_sales_cashier_id ON public.sales(cashier_id);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON public.sales(created_at);
CREATE INDEX IF NOT EXISTS idx_sales_items_sale_id ON public.sales_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sales_items_product_id ON public.sales_items(product_id);
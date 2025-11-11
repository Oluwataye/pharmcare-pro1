-- Create print_analytics table to track all print operations
CREATE TABLE IF NOT EXISTS public.print_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- References
  sale_id UUID REFERENCES public.sales(id) ON DELETE SET NULL,
  receipt_id UUID REFERENCES public.receipts(id) ON DELETE SET NULL,
  
  -- User information
  cashier_id UUID,
  cashier_name TEXT,
  customer_name TEXT,
  
  -- Print details
  print_status TEXT NOT NULL CHECK (print_status IN ('success', 'failed', 'cancelled')),
  error_type TEXT,
  error_message TEXT,
  print_duration_ms INTEGER,
  is_reprint BOOLEAN NOT NULL DEFAULT false,
  
  -- Metadata
  sale_type TEXT,
  total_amount NUMERIC
);

-- Enable RLS
ALTER TABLE public.print_analytics ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view print analytics
CREATE POLICY "All authenticated users can view print analytics"
  ON public.print_analytics
  FOR SELECT
  USING (true);

-- Authenticated users can insert their own print analytics
CREATE POLICY "Authenticated users can insert print analytics"
  ON public.print_analytics
  FOR INSERT
  WITH CHECK (auth.uid() = cashier_id);

-- Create indexes for faster filtering
CREATE INDEX idx_print_analytics_created_at ON public.print_analytics(created_at DESC);
CREATE INDEX idx_print_analytics_cashier_id ON public.print_analytics(cashier_id);
CREATE INDEX idx_print_analytics_customer_name ON public.print_analytics(customer_name);
CREATE INDEX idx_print_analytics_print_status ON public.print_analytics(print_status);
CREATE INDEX idx_print_analytics_sale_id ON public.print_analytics(sale_id);

-- Add trigger for updated_at
CREATE TRIGGER update_print_analytics_updated_at
  BEFORE UPDATE ON public.print_analytics
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
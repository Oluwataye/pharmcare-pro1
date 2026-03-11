-- Add cost_price to sales_items for accurate COGS tracking in P&L
ALTER TABLE public.sales_items 
ADD COLUMN IF NOT EXISTS cost_price NUMERIC DEFAULT 0;

-- Backfill existing sales_items with current cost_price from inventory (best effort for past data)
UPDATE public.sales_items si
SET cost_price = i.cost_price
FROM public.inventory i
WHERE si.product_id = i.id
AND (si.cost_price = 0 OR si.cost_price IS NULL);

-- Add opening_cash and closing_cash validation if needed
-- This migration ensures we can calculate Revenue - COGS - Expenses = Net Profit accurately.

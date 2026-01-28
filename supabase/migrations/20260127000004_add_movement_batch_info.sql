-- Migration: Add batch_number to stock_movements

ALTER TABLE public.stock_movements
ADD COLUMN IF NOT EXISTS batch_number TEXT,
ADD COLUMN IF NOT EXISTS expiry_date DATE;

-- Update existing records if needed (optional, null is fine for legacy)

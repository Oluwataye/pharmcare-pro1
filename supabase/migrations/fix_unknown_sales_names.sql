-- Migration: Fix Unknown Dispenser Names in Sales History
-- Description: Backfills missing cashier_name in sales table using data from profiles table.

-- 1. Update sales where cashier_name is 'Unknown' or NULL using profiles.name
UPDATE public.sales s
SET cashier_name = p.name
FROM public.profiles p
WHERE s.cashier_id = p.user_id
  AND (s.cashier_name IS NULL OR s.cashier_name = 'Unknown')
  AND p.name IS NOT NULL;

-- 2. Log key repair metrics
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Repaired % sales records with missing dispenser names.', updated_count;
END $$;

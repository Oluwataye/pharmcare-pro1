-- Migration: Fix Inventory Trigger Error
-- Description: The handle_updated_at trigger was applied to inventory table which doesn't have updated_at column

-- First drop the failing trigger
DROP TRIGGER IF EXISTS set_updated_at_inventory ON public.inventory;

-- Create correct trigger function for tables using last_updated_at
CREATE OR REPLACE FUNCTION public.handle_last_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.last_updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Apply correct trigger to inventory table
CREATE TRIGGER set_last_updated_at_inventory
  BEFORE UPDATE ON public.inventory
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_last_updated_at();

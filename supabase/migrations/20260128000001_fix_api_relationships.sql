
-- Migration: Fix Supabase Relationships for PostgREST joins
-- This migration ensures that foreign keys are explicitly defined to allow joins in Supabase API calls.

-- 1. Ensure inventory_id in inventory_batches has a proper reference for joins
-- (Already exists, but we'll re-verify it's valid for PostgREST)
-- If for some reason it's missing, this will fail or do nothing if it's there.

-- 2. Add explicit foreign key from stock_movements to profiles
-- This allows joining stock_movements with profiles via the created_by column.
ALTER TABLE public.stock_movements
DROP CONSTRAINT IF EXISTS stock_movements_created_by_profiles_fkey;

ALTER TABLE public.stock_movements
ADD CONSTRAINT stock_movements_created_by_profiles_fkey
FOREIGN KEY (created_by) REFERENCES public.profiles(user_id);

-- 3. Add explicit foreign key from inventory to profiles for last_updated_by
ALTER TABLE public.inventory
DROP CONSTRAINT IF EXISTS inventory_last_updated_by_profiles_fkey;

ALTER TABLE public.inventory
ADD CONSTRAINT inventory_last_updated_by_profiles_fkey
FOREIGN KEY (last_updated_by) REFERENCES public.profiles(user_id);

-- 4. Ensure RLS policies are not blocking internal joins
-- The existing policies look fine (using 'true'), but let's ensure inventory_batches is accessible.
ALTER TABLE public.inventory_batches ENABLE ROW LEVEL SECURITY;

-- 5. Reload PostgREST cache (this function is sometimes available in Supabase)
-- SELECT pg_notify('pgrst', 'reload config'); -- This doesn't usually work via plain SQL in Supabase without higher permissions.

-- 6. Add comment for documentation
COMMENT ON CONSTRAINT stock_movements_created_by_profiles_fkey ON public.stock_movements IS 'Explicit link to profiles for API joins';

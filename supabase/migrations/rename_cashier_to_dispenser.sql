
-- Migration: Rename CASHIER role to DISPENSER

-- 1. Add 'DISPENSER' to the app_role enum
-- PostgreSQL doesn't allow renaming enum values easily if used in tables.
-- The safest way is to add the new value, update data, and then (optionally) remove the old one.

ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'DISPENSER';

-- 2. Update existing user_roles records
UPDATE public.user_roles 
SET role = 'DISPENSER' 
WHERE role = 'CASHIER';

-- 3. Update the handle_new_user function to use 'DISPENSER' as default
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $function$
begin
  insert into public.profiles (user_id, username, email, full_name, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'username',
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );

  insert into public.user_roles (user_id, role)
  values (
    new.id,
    COALESCE((new.raw_user_meta_data->>'role')::app_role, 'DISPENSER'::app_role)
  );

  return new;
end;
$function$;

-- NOTE: We keep 'CASHIER' in the enum for now to avoid breaking existing migrations 
-- or edge functions that might still be sending it during the transition.
-- In a future cleanup, we can remove 'CASHIER' if desired.

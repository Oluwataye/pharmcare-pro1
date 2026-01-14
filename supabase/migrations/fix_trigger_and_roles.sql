
-- Migration: Fix handle_new_user trigger and repair missing roles

-- 1. Fix the handle_new_user function to use correct columns for 'profiles'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $function$
begin
  -- Insert into profiles using the correct column 'name' (not full_name)
  insert into public.profiles (user_id, name, username)
  values (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', new.email),
    new.raw_user_meta_data->>'username'
  );

  -- Insert into user_roles
  insert into public.user_roles (user_id, role)
  values (
    new.id,
    COALESCE((new.raw_user_meta_data->>'role')::app_role, 'DISPENSER'::app_role)
  );

  return new;
end;
$function$;

-- 2. Repair missing roles for existing users
-- Specifically fix the current user reported in logs: 38412691-1b6c-46db-8ce7-6c64843eafcf
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'SUPER_ADMIN'::app_role
FROM auth.users
WHERE id = '38412691-1b6c-46db-8ce7-6c64843eafcf'
ON CONFLICT DO NOTHING;

-- Ensure they have a profile too
INSERT INTO public.profiles (user_id, name)
SELECT id, email
FROM auth.users
WHERE id = '38412691-1b6c-46db-8ce7-6c64843eafcf'
ON CONFLICT DO NOTHING;

-- 3. Cleanup: Ensure ALL users have a role and profile
-- (Optional but good for stability)
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'DISPENSER'::app_role
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_roles)
ON CONFLICT DO NOTHING;

INSERT INTO public.profiles (user_id, name)
SELECT id, email
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.profiles)
ON CONFLICT DO NOTHING;

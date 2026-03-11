-- Drop the restrictive policies and recreate as permissive
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view all roles" ON public.user_roles;

-- Create permissive SELECT policies (default is PERMISSIVE)
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Users can view all profiles'
  ) THEN 
    CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
  END IF; 
END
$$;

DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_roles' AND policyname = 'Users can view all roles'
  ) THEN 
    CREATE POLICY "Users can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (true);
  END IF; 
END
$$;
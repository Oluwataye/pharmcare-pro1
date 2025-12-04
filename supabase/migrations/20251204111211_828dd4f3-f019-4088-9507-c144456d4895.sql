-- Drop the restrictive policies and recreate as permissive
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view all roles" ON public.user_roles;

-- Create permissive SELECT policies (default is PERMISSIVE)
CREATE POLICY "Users can view all profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Users can view all roles" 
ON public.user_roles 
FOR SELECT 
TO authenticated
USING (true);
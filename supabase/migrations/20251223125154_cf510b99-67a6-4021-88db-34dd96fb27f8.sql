-- Drop existing permissive policies on profiles table
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create restrictive policy: users can only view their own profile OR SUPER_ADMIN can view all
CREATE POLICY "Users can view own profile or admins view all" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() = user_id 
  OR has_role(auth.uid(), 'SUPER_ADMIN'::app_role)
);

-- Drop existing permissive policies on user_roles table
DROP POLICY IF EXISTS "Users can view all roles" ON public.user_roles;

-- Create restrictive policy: users can only view their own role OR SUPER_ADMIN can view all
CREATE POLICY "Users can view own role or admins view all" 
ON public.user_roles 
FOR SELECT 
USING (
  auth.uid() = user_id 
  OR has_role(auth.uid(), 'SUPER_ADMIN'::app_role)
);
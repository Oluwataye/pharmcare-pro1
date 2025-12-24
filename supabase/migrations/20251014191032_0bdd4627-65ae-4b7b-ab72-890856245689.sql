-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('SUPER_ADMIN', 'PHARMACIST', 'CASHIER');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name TEXT NOT NULL,
  username TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, role)
);

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create inventory table
CREATE TABLE public.inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  sku TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  unit TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  reorder_level INTEGER NOT NULL DEFAULT 10,
  expiry_date DATE,
  manufacturer TEXT,
  batch_number TEXT,
  last_updated_by UUID REFERENCES auth.users(id),
  last_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create store_settings table
CREATE TABLE public.store_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'PharmaCare Pro',
  address TEXT,
  phone TEXT,
  email TEXT,
  print_show_logo BOOLEAN DEFAULT TRUE,
  print_show_address BOOLEAN DEFAULT TRUE,
  print_show_email BOOLEAN DEFAULT TRUE,
  print_show_phone BOOLEAN DEFAULT TRUE,
  print_show_footer BOOLEAN DEFAULT TRUE,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default store settings
INSERT INTO public.store_settings (name, address, phone, email)
VALUES ('PharmaCare Pro', '123 Main Street, Lagos', '080-1234-5678', 'contact@pharmacarepro.com');

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Super admins can insert profiles"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'SUPER_ADMIN'));

-- User roles policies
CREATE POLICY "Users can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "Super admins can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'SUPER_ADMIN'))
  WITH CHECK (public.has_role(auth.uid(), 'SUPER_ADMIN'));

-- Inventory policies
CREATE POLICY "All authenticated users can view inventory"
  ON public.inventory FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "Super admins and pharmacists can insert inventory"
  ON public.inventory FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'SUPER_ADMIN') OR 
    public.has_role(auth.uid(), 'PHARMACIST')
  );

CREATE POLICY "Super admins and pharmacists can update inventory"
  ON public.inventory FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'SUPER_ADMIN') OR 
    public.has_role(auth.uid(), 'PHARMACIST')
  );

CREATE POLICY "Super admins and pharmacists can delete inventory"
  ON public.inventory FOR DELETE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'SUPER_ADMIN') OR 
    public.has_role(auth.uid(), 'PHARMACIST')
  );

-- Store settings policies
CREATE POLICY "All authenticated users can view settings"
  ON public.store_settings FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "Only super admins can update settings"
  ON public.store_settings FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'SUPER_ADMIN'));

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Add triggers for updated_at
CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_inventory
  BEFORE UPDATE ON public.inventory
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_settings
  BEFORE UPDATE ON public.store_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (user_id, name, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.raw_user_meta_data->>'username'
  );
  
  -- Insert default role (CASHIER) if no role specified
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'CASHIER'::app_role)
  );
  
  RETURN NEW;
END;
$$;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
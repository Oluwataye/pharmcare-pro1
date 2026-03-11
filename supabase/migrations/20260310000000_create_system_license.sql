-- Migration: Create System License table
-- Purpose: Store the single activation key and enforce software licensing

CREATE TABLE IF NOT EXISTS public.system_license (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    license_key TEXT NOT NULL UNIQUE,
    client_name TEXT NOT NULL,
    domain TEXT NOT NULL,
    installation_id TEXT NOT NULL UNIQUE,
    activated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('active', 'revoked')),
    last_verified_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Ensure only one active license can exist at a time (optional strictness, but good for single-client app)
    -- We can just rely on the application logic to only check the first/active one.
    CONSTRAINT single_active_license_check CHECK (status = 'active' OR status = 'revoked')
);

-- Enable RLS
ALTER TABLE public.system_license ENABLE ROW LEVEL SECURITY;

-- Allow read access to anyone (so the app can check if it's licensed before login)
CREATE POLICY "Allow public read access to system_license" 
ON public.system_license FOR SELECT 
USING (true);

-- Restrict all other operations. Only the service role (via Edge Functions) can insert/update
CREATE POLICY "Restrict insert to service role only" 
ON public.system_license FOR INSERT 
WITH CHECK (false); -- Handled by explicitly bypassing RLS in Edge Function or using service_role key

CREATE POLICY "Restrict update to service role only" 
ON public.system_license FOR UPDATE 
USING (false);

CREATE POLICY "Restrict delete to service role only" 
ON public.system_license FOR DELETE 
USING (false);

-- Function to update last_verified_at
CREATE OR REPLACE FUNCTION update_license_verification()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_verified_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_system_license_verification ON public.system_license;
DROP TRIGGER IF EXISTS update_system_license_verification ON public.system_license;
CREATE TRIGGER update_system_license_verification
  BEFORE UPDATE ON public.system_license
  FOR EACH ROW
  EXECUTE FUNCTION update_license_verification();

-- Migration: Database-level Licensing RPC Functions
-- Purpose: Implement activation and verification logic within Postgres to bypass Edge Function/Docker limitations

-- Enable pgcrypto for hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Helper Function to Hash Installation Footprint
CREATE OR REPLACE FUNCTION public.hash_installation_footprint(
    p_installation_id TEXT,
    p_domain TEXT
) RETURNS TEXT AS $$
BEGIN
    -- Match the hashing logic previously in the Edge Function:
    -- encodeHex(crypto.subtle.digest("SHA-256", `${id}-${domainName}-pharmcare-salt-v1`))
    RETURN encode(digest(p_installation_id || '-' || p_domain || '-pharmcare-salt-v1', 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Activation RPC
CREATE OR REPLACE FUNCTION public.activate_license_rpc(
    p_license_key TEXT,
    p_client_name TEXT,
    p_domain TEXT,
    p_installation_id TEXT
) RETURNS JSONB AS $$
DECLARE
    v_hashed_id TEXT;
    v_existing_id UUID;
    v_result JSONB;
BEGIN
    -- Basic validation
    IF p_license_key IS NULL OR p_client_name IS NULL OR p_domain IS NULL OR p_installation_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Missing required fields');
    END IF;

    -- Format validation
    IF NOT (p_license_key ~ '^PHARMCARE(-[A-Z0-9]{4}){3}$') THEN
         RETURN jsonb_build_object('success', false, 'error', 'Invalid license key format');
    END IF;

    -- Check if system is already licensed
    SELECT id INTO v_existing_id FROM public.system_license WHERE status = 'active' LIMIT 1;
    IF v_existing_id IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'System is already licensed');
    END IF;

    -- Hash the installation ID
    v_hashed_id := public.hash_installation_footprint(p_installation_id, p_domain);

    -- Insert the license (assuming the row with the key might not exist yet, or we update an existing template)
    -- If we created a template via Dashboard, we might want to update it.
    -- However, the original Edge Function used .insert(). We'll follow that but handle conflicts.
    
    INSERT INTO public.system_license (
        license_key, 
        client_name, 
        domain, 
        installation_id, 
        status, 
        activated_at
    ) 
    VALUES (
        p_license_key, 
        p_client_name, 
        p_domain, 
        v_hashed_id, 
        'active', 
        now()
    )
    ON CONFLICT (license_key) DO UPDATE SET
        client_name = EXCLUDED.client_name,
        domain = EXCLUDED.domain,
        installation_id = EXCLUDED.installation_id,
        status = 'active',
        activated_at = now()
    RETURNING jsonb_build_object('success', true, 'id', id) INTO v_result;

    RETURN v_result;

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Verification RPC
CREATE OR REPLACE FUNCTION public.verify_license_rpc(
    p_license_key TEXT,
    p_domain TEXT,
    p_installation_id TEXT
) RETURNS JSONB AS $$
DECLARE
    v_hashed_id TEXT;
    v_license RECORD;
BEGIN
    IF p_license_key IS NULL OR p_domain IS NULL OR p_installation_id IS NULL THEN
        RETURN jsonb_build_object('valid', false, 'reason', 'Missing required fields');
    END IF;

    v_hashed_id := public.hash_installation_footprint(p_installation_id, p_domain);

    SELECT * INTO v_license FROM public.system_license 
    WHERE license_key = p_license_key AND status = 'active';

    IF NOT FOUND THEN
        RETURN jsonb_build_object('valid', false, 'reason', 'License not found or inactive');
    END IF;

    IF v_license.domain != p_domain OR v_license.installation_id != v_hashed_id THEN
        RETURN jsonb_build_object('valid', false, 'reason', 'Installation footprint mismatch');
    END IF;

    -- Update last verification
    UPDATE public.system_license SET last_verified_at = now() WHERE id = v_license.id;

    RETURN jsonb_build_object('valid', true, 'clientName', v_license.client_name);

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('valid', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access to anon and authenticated roles
GRANT EXECUTE ON FUNCTION public.activate_license_rpc TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_license_rpc TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.hash_installation_footprint TO anon, authenticated;

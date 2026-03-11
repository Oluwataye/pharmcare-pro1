-- Migration: Relax license key format validation
-- Purpose: Allow more flexible license key formats (including test keys) in the RPC function

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

    -- Format validation: Allow alphanumeric characters and hyphens, at least 4 characters long
    IF NOT (p_license_key ~ '^[A-Z0-9-]{4,64}$') THEN
         RETURN jsonb_build_object('success', false, 'error', 'Invalid license key format. Use alphanumeric characters and hyphens (4-64 chars).');
    END IF;

    -- Check if system is already licensed
    SELECT id INTO v_existing_id FROM public.system_license WHERE status = 'active' LIMIT 1;
    IF v_existing_id IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'System is already licensed');
    END IF;

    -- Hash the installation ID
    v_hashed_id := public.hash_installation_footprint(p_installation_id, p_domain);

    -- Insert or Update the license record
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

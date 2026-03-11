-- Migration: Refine activate_license_rpc for manual record support
-- Purpose: Allow linking an installation footprint to an existing license record with the same key.

CREATE OR REPLACE FUNCTION public.activate_license_rpc(
    p_license_key TEXT,
    p_client_name TEXT,
    p_domain TEXT,
    p_installation_id TEXT
) RETURNS JSONB AS $$
DECLARE
    v_hashed_id TEXT;
    v_existing_key TEXT;
    v_result JSONB;
BEGIN
    -- Basic validation
    IF p_license_key IS NULL OR p_client_name IS NULL OR p_domain IS NULL OR p_installation_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Missing required fields');
    END IF;

    -- Format validation
    IF NOT (p_license_key ~ '^[A-Z0-9-]{4,64}$') THEN
         RETURN jsonb_build_object('success', false, 'error', 'Invalid license key format');
    END IF;

    -- Check if a DIFFERENT license is already active
    SELECT license_key INTO v_existing_key FROM public.system_license 
    WHERE status = 'active' AND license_key != p_license_key LIMIT 1;
    
    IF v_existing_key IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'System is already licensed with another key (' || v_existing_key || ')');
    END IF;

    -- Hash the installation ID
    v_hashed_id := public.hash_installation_footprint(p_installation_id, p_domain);

    -- Insert or Update: Link the footprint to the key
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
        installation_id = EXCLUDED.installation_id, -- Link the footprint
        status = 'active',
        activated_at = COALESCE(public.system_license.activated_at, now())
    RETURNING jsonb_build_object('success', true, 'id', id) INTO v_result;

    RETURN v_result;

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

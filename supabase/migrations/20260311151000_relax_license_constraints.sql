-- Migration: Relax system_license constraints
-- Purpose: Allow manual creation of license keys before they are linked to an installation footprint

ALTER TABLE public.system_license 
ALTER COLUMN installation_id DROP NOT NULL,
ALTER COLUMN activated_at DROP NOT NULL;

-- Also update the check constraint if necessary, but currently it just checks 'active' or 'revoked'
-- which is fine.

COMMENT ON COLUMN public.system_license.installation_id IS 'Hashed hardware fingerprint, populated during activation.';
COMMENT ON COLUMN public.system_license.activated_at IS 'Timestamp of first activation, populated during activation.';

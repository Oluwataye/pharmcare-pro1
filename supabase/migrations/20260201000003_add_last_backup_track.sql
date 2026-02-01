-- Migration: Track last backup timestamp
ALTER TABLE public.store_settings 
ADD COLUMN IF NOT EXISTS last_backup_at TIMESTAMPTZ;

-- Add a column to track if automated backups are enabled
ALTER TABLE public.store_settings
ADD COLUMN IF NOT EXISTS enable_auto_backups BOOLEAN DEFAULT TRUE;

COMMENT ON COLUMN public.store_settings.last_backup_at IS 'Timestamp of the last successful automated backup';
COMMENT ON COLUMN public.store_settings.enable_auto_backups IS 'Toggle for automated daily backups';

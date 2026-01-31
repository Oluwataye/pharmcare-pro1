-- Add backup retention setting to store_settings
ALTER TABLE store_settings 
ADD COLUMN IF NOT EXISTS backup_retention_days INTEGER DEFAULT 30;

-- Update default for existing row
UPDATE store_settings SET backup_retention_days = 30 WHERE backup_retention_days IS NULL;

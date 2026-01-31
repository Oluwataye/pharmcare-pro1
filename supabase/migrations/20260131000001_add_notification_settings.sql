-- Add notification settings to store_settings table
ALTER TABLE store_settings 
ADD COLUMN IF NOT EXISTS low_stock_threshold_global INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS enable_low_stock_alerts BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS enable_backup_alerts BOOLEAN DEFAULT true;

-- Update existing row if it exists, or insert default
INSERT INTO store_settings (id, low_stock_threshold_global, enable_low_stock_alerts, enable_backup_alerts)
VALUES (1, 10, true, true)
ON CONFLICT (id) DO UPDATE SET
low_stock_threshold_global = EXCLUDED.low_stock_threshold_global,
enable_low_stock_alerts = EXCLUDED.enable_low_stock_alerts,
enable_backup_alerts = EXCLUDED.enable_backup_alerts
WHERE store_settings.low_stock_threshold_global IS NULL;

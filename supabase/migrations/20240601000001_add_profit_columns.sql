-- Add cost_price to inventory table
ALTER TABLE inventory 
ADD COLUMN IF NOT EXISTS cost_price DECIMAL(10,2) DEFAULT 0;

-- Add cost_price to sales_items table (to capture historical cost at time of sale)
ALTER TABLE sales_items 
ADD COLUMN IF NOT EXISTS cost_price DECIMAL(10,2) DEFAULT 0;

-- Comment on columns
COMMENT ON COLUMN inventory.cost_price IS 'Cost price of the item per unit';
COMMENT ON COLUMN sales_items.cost_price IS 'Cost price of the item at the moment of sale';

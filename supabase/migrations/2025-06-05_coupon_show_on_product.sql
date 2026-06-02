-- Add show_on_product flag to coupons table
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS show_on_product BOOLEAN DEFAULT false;

-- Add idempotency_key to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS idempotency_key text UNIQUE;

-- Payment logs table
CREATE TABLE IF NOT EXISTS payment_logs (
  id serial PRIMARY KEY,
  order_id integer REFERENCES orders(id),
  user_id uuid,
  payment_method text,
  status text NOT NULL,
  amount numeric(10,2),
  gateway_id text,
  gateway_response jsonb DEFAULT '{}',
  error_message text,
  ip_address text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_logs_order_id ON payment_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_user_id ON payment_logs(user_id);

ALTER TABLE payment_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on payment_logs" ON payment_logs
  FOR ALL USING (auth.role() = 'service_role');

-- Admin audit log table
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id serial PRIMARY KEY,
  user_id uuid,
  user_email text,
  action text NOT NULL,
  entity_type text,
  entity_id text,
  details jsonb DEFAULT '{}',
  ip_address text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON admin_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON admin_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON admin_audit_log(created_at DESC);

ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on audit_log" ON admin_audit_log
  FOR ALL USING (auth.role() = 'service_role');

-- Useful indexes for products
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category_slug ON products(category_slug);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);

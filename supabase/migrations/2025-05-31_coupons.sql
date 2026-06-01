-- Migration: Sistema de Cupons de Desconto
-- Rodar no SQL Editor do Supabase Dashboard

CREATE TABLE IF NOT EXISTS coupons (
  id SERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC(10,2) NOT NULL,
  min_order_value NUMERIC(10,2) DEFAULT 0,
  max_uses INTEGER DEFAULT NULL,
  used_count INTEGER DEFAULT 0,
  max_uses_per_user INTEGER DEFAULT 1,
  starts_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  applies_to TEXT DEFAULT 'all' CHECK (applies_to IN ('all', 'category', 'product')),
  applies_to_ids TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(is_active);

-- Tabela de uso de cupons por usuário
CREATE TABLE IF NOT EXISTS coupon_uses (
  id SERIAL PRIMARY KEY,
  coupon_id INTEGER REFERENCES coupons(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
  discount_applied NUMERIC(10,2) NOT NULL,
  used_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(coupon_id, user_id, order_id)
);

CREATE INDEX IF NOT EXISTS idx_coupon_uses_coupon ON coupon_uses(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_uses_user ON coupon_uses(user_id);

-- RLS
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read active coupons" ON coupons FOR SELECT USING (is_active = true);
CREATE POLICY "Service role full access coupons" ON coupons FOR ALL USING (auth.role() = 'service_role');

ALTER TABLE coupon_uses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own coupon uses" ON coupon_uses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role full access coupon_uses" ON coupon_uses FOR ALL USING (auth.role() = 'service_role');
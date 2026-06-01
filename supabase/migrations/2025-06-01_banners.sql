-- Migration: Sistema de Banners
-- Rodar no SQL Editor do Supabase Dashboard

CREATE TABLE IF NOT EXISTS banners (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  tag TEXT,
  cta_text TEXT DEFAULT 'Ver produtos',
  cta_link TEXT DEFAULT '/produtos',
  product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  product_image_url TEXT,
  template TEXT NOT NULL DEFAULT 'hero' CHECK (template IN ('hero', 'promo', 'launch', 'category')),
  bg_color TEXT DEFAULT '#0a0a0b',
  accent_color TEXT DEFAULT '#dc2626',
  text_color TEXT DEFAULT '#ffffff',
  position INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  starts_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_banners_active ON banners(is_active);
CREATE INDEX IF NOT EXISTS idx_banners_position ON banners(position);

ALTER TABLE banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read active banners"
ON banners FOR SELECT USING (is_active = true);

CREATE POLICY "Service role full access banners"
ON banners FOR ALL USING (auth.role() = 'service_role');
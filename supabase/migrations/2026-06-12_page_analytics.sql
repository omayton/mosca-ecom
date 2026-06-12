-- Migration: Rastreamento de visitas próprio (sem depender de GA4 API)
-- Rodar no SQL Editor do Supabase Dashboard

CREATE TABLE IF NOT EXISTS page_views (
  id        bigserial PRIMARY KEY,
  path      text NOT NULL,
  referrer  text,
  device    text,        -- 'mobile' | 'desktop' | 'tablet'
  created_at timestamptz DEFAULT now()
);

-- Índices para queries rápidas no admin
CREATE INDEX IF NOT EXISTS idx_page_views_created ON page_views(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_path    ON page_views(path);

-- RLS: apenas service_role pode ler/escrever
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages page_views"
  ON page_views FOR ALL
  USING (auth.role() = 'service_role');

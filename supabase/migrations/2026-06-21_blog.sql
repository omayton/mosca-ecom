-- Migration: Blog automotivo
-- Rode no SQL Editor do Supabase Dashboard. Idempotente.

CREATE TABLE IF NOT EXISTS blog_posts (
  id serial PRIMARY KEY,
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  excerpt text,
  content text NOT NULL DEFAULT '',         -- markdown
  cover_image_url text,
  author text NOT NULL DEFAULT 'Equipe Mosca Branca Parts',
  category text,
  tags text[] DEFAULT '{}',
  reading_minutes int DEFAULT 3,
  meta_title text,
  meta_description text,
  is_published boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts(is_published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category);

ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Público pode ler posts publicados; service_role (admin) acesso total.
DROP POLICY IF EXISTS "Public read published blog_posts" ON blog_posts;
CREATE POLICY "Public read published blog_posts"
  ON blog_posts FOR SELECT
  USING (is_published = true);

DROP POLICY IF EXISTS "Service role full access on blog_posts" ON blog_posts;
CREATE POLICY "Service role full access on blog_posts"
  ON blog_posts FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE OR REPLACE FUNCTION update_blog_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_blog_posts_updated_at ON blog_posts;
CREATE TRIGGER trg_blog_posts_updated_at
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW EXECUTE FUNCTION update_blog_posts_updated_at();

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id serial PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text DEFAULT '',
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read active categories" ON categories
  FOR SELECT USING (is_active = true);

CREATE POLICY "Service role full access" ON categories
  FOR ALL USING (auth.role() = 'service_role');

-- Seed com categorias existentes dos produtos
INSERT INTO categories (name, slug, sort_order) VALUES
  ('Saídas de Ar', 'saidas-de-ar', 1),
  ('Acessórios', 'acessorios', 2),
  ('Banco e Assento', 'banco-e-assento', 3),
  ('Câmbio', 'cambio', 4),
  ('Fechaduras', 'fechaduras', 5),
  ('Freios', 'freios', 6),
  ('Iluminação', 'iluminacao', 7),
  ('Interruptores e Botões', 'interruptores-e-botoes', 8),
  ('Limpadores', 'limpadores', 9),
  ('Motor', 'motor', 10),
  ('Tampas e Acabamentos', 'tampas-e-acabamentos', 11),
  ('Teto Solar', 'teto-solar', 12),
  ('Vedações', 'vedacoes', 13)
ON CONFLICT (slug) DO NOTHING;

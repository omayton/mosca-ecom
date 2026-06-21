-- Migration: Oferta Relâmpago (Flash Sale)
-- Rode no SQL Editor do Supabase Dashboard. Idempotente.

-- Uma campanha de oferta relâmpago: título, janela (início/fim), % de desconto.
CREATE TABLE IF NOT EXISTS flash_sales (
  id serial PRIMARY KEY,
  title text NOT NULL,
  description text,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  discount_percent numeric(5,2) NOT NULL DEFAULT 0 CHECK (discount_percent >= 0 AND discount_percent <= 100),
  is_active boolean NOT NULL DEFAULT true,   -- liga/desliga manual (mesmo dentro da janela)
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Produtos participantes de cada campanha.
CREATE TABLE IF NOT EXISTS flash_sale_products (
  flash_sale_id int NOT NULL REFERENCES flash_sales(id) ON DELETE CASCADE,
  product_id int NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  PRIMARY KEY (flash_sale_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_flash_sales_window ON flash_sales(starts_at, ends_at);
CREATE INDEX IF NOT EXISTS idx_flash_sale_products_sale ON flash_sale_products(flash_sale_id);
CREATE INDEX IF NOT EXISTS idx_flash_sale_products_prod ON flash_sale_products(product_id);

ALTER TABLE flash_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE flash_sale_products ENABLE ROW LEVEL SECURITY;

-- service_role (admin + server) acesso total
CREATE POLICY "Service role full access on flash_sales"
  ON flash_sales FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role full access on flash_sale_products"
  ON flash_sale_products FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_flash_sales_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_flash_sales_updated_at ON flash_sales;
CREATE TRIGGER trg_flash_sales_updated_at
  BEFORE UPDATE ON flash_sales
  FOR EACH ROW EXECUTE FUNCTION update_flash_sales_updated_at();

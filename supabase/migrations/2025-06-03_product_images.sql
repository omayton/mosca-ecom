-- Product images gallery table
CREATE TABLE IF NOT EXISTS product_images (
  id serial PRIMARY KEY,
  product_id integer NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url text NOT NULL,
  alt_text text DEFAULT '',
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);

ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public read product_images" ON product_images
  FOR SELECT USING (true);

-- Service role full access
CREATE POLICY "Service role full access on product_images" ON product_images
  FOR ALL USING (auth.role() = 'service_role');

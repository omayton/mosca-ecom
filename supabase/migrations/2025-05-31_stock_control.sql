-- Migration: Adicionar controle de estoque
-- Rodar no SQL Editor do Supabase Dashboard

-- Adicionar colunas de estoque na tabela products
ALTER TABLE products
ADD COLUMN IF NOT EXISTS stock_quantity INTEGER NOT NULL DEFAULT 999,
ADD COLUMN IF NOT EXISTS stock_threshold INTEGER NOT NULL DEFAULT 10,
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'available'
CHECK (status IN ('available', 'low_stock', 'out_of_stock', 'discontinued'));

-- Atualizar valores existentes para que não quebre
UPDATE products
SET stock_quantity = 999,
    stock_threshold = 10,
    status = 'available'
WHERE stock_quantity = 0 OR stock_quantity IS NULL;

-- Trigger para atualizar status automaticamente
CREATE OR REPLACE FUNCTION update_product_status()
RETURNS TRIGGER AS $$
BEGIN
    NEW.status = CASE
        WHEN NEW.stock_quantity = 0 THEN 'out_of_stock'
        WHEN NEW.stock_quantity <= NEW.stock_threshold THEN 'low_stock'
        ELSE 'available'
    END;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_product_stock_change ON products;
CREATE TRIGGER on_product_stock_change
BEFORE INSERT OR UPDATE OF stock_quantity ON products
FOR EACH ROW EXECUTE FUNCTION update_product_status();

-- Índices para consultas de estoque
CREATE INDEX IF NOT EXISTS idx_products_stock_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_stock_quantity ON products(stock_quantity) WHERE stock_quantity <= stock_threshold;
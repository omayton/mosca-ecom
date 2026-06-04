-- Migration: Migrar produtos existentes para o sistema de múltiplas imagens
-- Este script cria registros em product_images para todos os produtos
-- que já têm image_file preenchido na tabela products

-- Inserir a imagem existente como imagem principal (sort_order=0)
INSERT INTO product_images (product_id, url, alt_text, sort_order, created_at)
SELECT
  id as product_id,
  CASE
    WHEN image_file LIKE 'http%' THEN image_file
    WHEN image_file IS NOT NULL AND image_file != '' AND image_file != 'placeholder' THEN
      'https://www.moscabrancaparts.com.br/wp-content/uploads/2026/04/' || image_file
    ELSE 'https://www.moscabrancaparts.com.br/wp-content/uploads/2026/04/woocommerce-placeholder-400x400.png'
  END as url,
  COALESCE(name, '') as alt_text,
  0 as sort_order,
  NOW() as created_at
FROM products
WHERE
  image_file IS NOT NULL
  AND image_file != ''
  AND NOT EXISTS (
    SELECT 1 FROM product_images WHERE product_id = products.id
  );

-- Verificação: mostrar quantos produtos foram migrados
-- DO $$ DECLARE
--   migrated_count INTEGER;
-- BEGIN
--   SELECT COUNT(DISTINCT product_id) INTO migrated_count FROM product_images WHERE sort_order = 0;
--   RAISE NOTICE 'Produtos migrados para sistema de imagens: %', migrated_count;
-- END $$;

-- Migra produtos existentes com image_file para product_images (executar uma vez)

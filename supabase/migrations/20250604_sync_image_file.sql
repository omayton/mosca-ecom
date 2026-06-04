-- Sincroniza products.image_file com a imagem principal de product_images
-- Resolve o problema de miniaturas quebradas na home quando o produto tem fotos novas

-- 1. Para produtos com imagens em product_images:
--    Atualiza image_file com a URL da imagem principal (sort_order=0)
UPDATE products p
SET image_file = sub.url
FROM (
  SELECT DISTINCT ON (product_id) product_id, url
  FROM product_images
  WHERE sort_order = 0
  ORDER BY product_id, id ASC
) sub
WHERE p.id = sub.product_id
  AND p.image_file <> sub.url;

-- 2. Para produtos sem imagens em product_images e com image_file legado (não-URL):
--    Seta NULL para que o sistema use placeholder
UPDATE products
SET image_file = NULL
WHERE NOT EXISTS (
  SELECT 1 FROM product_images WHERE product_id = products.id
)
AND image_file IS NOT NULL
AND image_file != ''
AND image_file != 'placeholder'
AND image_file NOT LIKE 'http%';

-- Verificação (rodar separadamente para conferir):
-- SELECT id, slug, image_file FROM products WHERE image_file IS NULL OR image_file LIKE '%supabase.co%';

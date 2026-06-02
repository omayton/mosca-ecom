-- Seed: avaliações iniciais para dar confiança na loja
-- Para remover depois: DELETE FROM product_reviews WHERE user_id = '00000000-0000-0000-0000-000000000001';

INSERT INTO product_reviews (product_id, user_id, user_name, rating, title, comment, is_verified_purchase, is_approved, created_at) VALUES
-- Produto 1: Botão Comando de Som Vectra
(1, '00000000-0000-0000-0000-000000000001', 'Ricardo M.', 5, 'Peça original, encaixe perfeito', 'Procurei essa peça por meses. Chegou rápido e encaixou direitinho no volante do meu Vectra 2010. Recomendo demais!', true, true, NOW() - INTERVAL '12 days'),
(1, '00000000-0000-0000-0000-000000000001', 'Fernanda Costa', 5, 'Excelente qualidade', 'Produto idêntico ao original. Embalagem cuidadosa e entrega antes do prazo.', true, true, NOW() - INTERVAL '8 days'),
(1, '00000000-0000-0000-0000-000000000001', 'Carlos Eduardo', 4, 'Bom produto', 'Funcionou perfeitamente. Só achei o preço um pouco salgado, mas é peça rara mesmo.', true, true, NOW() - INTERVAL '3 days'),

-- Produto 2: Capas Limpa Para-brisas VW
(2, '00000000-0000-0000-0000-000000000001', 'João Paulo', 5, 'Perfeitas para o Gol', 'Capas de excelente qualidade, encaixaram certinho. Acabamento impecável.', true, true, NOW() - INTERVAL '15 days'),
(2, '00000000-0000-0000-0000-000000000001', 'Mariana S.', 5, 'Produto top', 'Muito bem feitas, material resistente. Já indiquei para outros amigos que têm VW.', true, true, NOW() - INTERVAL '6 days'),

-- Produto 3: Bucha Batente Sensor Honda
(3, '00000000-0000-0000-0000-000000000001', 'Anderson Lima', 5, 'Resolveu meu problema', 'A luz do freio do meu Civic ficava acesa direto. Com essas buchas resolveu na hora. Peça simples mas difícil de achar.', true, true, NOW() - INTERVAL '20 days'),
(3, '00000000-0000-0000-0000-000000000001', 'Thiago Rocha', 4, 'Funcionou bem', 'Instalação simples e resolveu o problema da luz de freio. Boa qualidade.', true, true, NOW() - INTERVAL '10 days'),

-- Produto 4: Patins Teto Solar Fiat Stilo
(4, '00000000-0000-0000-0000-000000000001', 'Lucas Mendes', 5, 'Salvou meu teto solar!', 'Impossível de achar essa peça. O teto solar travava e com os patins novos voltou a funcionar perfeito. Obrigado Mosca Branca!', true, true, NOW() - INTERVAL '25 days'),
(4, '00000000-0000-0000-0000-000000000001', 'Patrícia Alves', 5, 'Peça rara de verdade', 'Já tinha procurado em vários desmontes e nada. Aqui encontrei e chegou em 3 dias. Muito satisfeita.', true, true, NOW() - INTERVAL '18 days'),

-- Produto 5 (se existir)
(5, '00000000-0000-0000-0000-000000000001', 'Roberto Silva', 5, 'Ótima loja', 'Atendimento excelente via WhatsApp, tiraram todas as dúvidas. Peça chegou bem embalada e funciona perfeitamente.', true, true, NOW() - INTERVAL '14 days'),
(5, '00000000-0000-0000-0000-000000000001', 'Ana Carolina', 4, 'Bom custo-benefício', 'Produto de qualidade, entrega no prazo. Recomendo a loja para quem precisa de peças difíceis.', true, true, NOW() - INTERVAL '7 days'),

-- Produto 6
(6, '00000000-0000-0000-0000-000000000001', 'Diego Nascimento', 5, 'Incrível, achei aqui!', 'Peça que nenhuma loja tinha. Envio rápido e bem protegido. Já favoritei a loja.', true, true, NOW() - INTERVAL '22 days'),

-- Produto 7
(7, '00000000-0000-0000-0000-000000000001', 'Juliana Pires', 5, 'Super recomendo', 'Segunda compra aqui e mais uma vez surpreendida com a qualidade e agilidade. Parabéns!', true, true, NOW() - INTERVAL '9 days'),
(7, '00000000-0000-0000-0000-000000000001', 'Marcos Oliveira', 4, 'Produto conforme descrito', 'Chegou dentro do prazo, peça em perfeitas condições. Atendeu minha expectativa.', true, true, NOW() - INTERVAL '4 days'),

-- Produto 8
(8, '00000000-0000-0000-0000-000000000001', 'Camila Ferreira', 5, 'Melhor loja de peças raras', 'Já comprei 3 vezes. Sempre encontro o que preciso aqui. Entrega confiável e produto original.', true, true, NOW() - INTERVAL '16 days'),

-- Produto 9
(9, '00000000-0000-0000-0000-000000000001', 'Felipe Santos', 5, 'Peça perfeita', 'Encaixou como uma luva no meu carro. Material de qualidade e frete razoável.', true, true, NOW() - INTERVAL '11 days'),

-- Produto 10
(10, '00000000-0000-0000-0000-000000000001', 'Renata Gomes', 4, 'Recomendo', 'Boa experiência de compra. A peça veio bem embalada e em ótimo estado.', true, true, NOW() - INTERVAL '5 days');

-- Update avg_rating and review_count on products
UPDATE products SET
  avg_rating = sub.avg_rating,
  review_count = sub.review_count
FROM (
  SELECT product_id, ROUND(AVG(rating)::numeric, 1) as avg_rating, COUNT(*) as review_count
  FROM product_reviews
  WHERE is_approved = true
  GROUP BY product_id
) sub
WHERE products.id = sub.product_id;

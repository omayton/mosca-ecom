-- Migration: Adicionar policies service_role para admin (carrinhos abandonados)
-- Rodar no SQL Editor do Supabase Dashboard

-- Permitir que service_role (admin) acesse todos os carrinhos
CREATE POLICY "Service role full access on cart_items"
  ON cart_items FOR ALL
  USING (auth.role() = 'service_role');

-- Permitir que service_role (admin) acesse todos os pedidos
CREATE POLICY "Service role full access on orders"
  ON orders FOR ALL
  USING (auth.role() = 'service_role');

-- Permitir que service_role (admin) acesse todos os order_items
CREATE POLICY "Service role full access on order_items"
  ON order_items FOR ALL
  USING (auth.role() = 'service_role');

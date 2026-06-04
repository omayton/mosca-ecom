-- Migration: Adicionar policy service_role para cart_items
-- Rodar no SQL Editor do Supabase Dashboard

-- Permitir que service_role (admin) acesse todos os carrinhos para relatórios
CREATE POLICY "Service role full access on cart_items"
  ON cart_items FOR ALL
  USING (auth.role() = 'service_role');

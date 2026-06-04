-- Migration: Adicionar first_added_at para detectar carrinhos abandonados
-- Rodar no SQL Editor do Supabase Dashboard

-- Adicionar coluna first_added_at
ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS first_added_at timestamptz DEFAULT now();

-- Atualizar registros existentes com a data atual
UPDATE cart_items SET first_added_at = created_at WHERE first_added_at IS NULL;

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_cart_items_first_added ON cart_items(first_added_at);

-- Agora o sistema de carrinho abandonado deve usar first_added_at em vez de updated_at

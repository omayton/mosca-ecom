-- ============================================================
-- DEFINITIVE FIX: cart_items schema + abandoned cart detection
-- Rodar no Supabase SQL Editor (Dashboard > SQL Editor).
-- Idempotente: pode rodar quantas vezes quiser.
-- ============================================================

-- 1. Garante a coluna first_added_at (essencial pra detecção de abandono)
ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS first_added_at timestamptz DEFAULT now();
UPDATE cart_items SET first_added_at = created_at WHERE first_added_at IS NULL;

-- 2. Garante a coluna updated_at
ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 3. Garante a UNIQUE CONSTRAINT (user_id, product_id) — sem ela o UPSERT falha silenciosamente
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'cart_items'::regclass AND contype = 'u'
    AND array_to_string(conkey, ',') = (
      SELECT array_to_string(array_agg(attnum), ',')
      FROM pg_attribute
      WHERE attrelid = 'cart_items'::regclass
      AND attname IN ('user_id', 'product_id')
    )
  ) THEN
    ALTER TABLE cart_items ADD CONSTRAINT cart_items_user_id_product_id_key UNIQUE (user_id, product_id);
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 4. Índice pra acelerar a query de carrinhos abandonados
CREATE INDEX IF NOT EXISTS idx_cart_items_first_added ON cart_items(first_added_at);

-- 5. RLS + policy service_role (upsert via API usa service role, bypassa RLS, mas garante)
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- Remove policy antiga se existir e recria (idempotente)
DROP POLICY IF EXISTS "Service role full access on cart_items" ON cart_items;
CREATE POLICY "Service role full access on cart_items"
  ON cart_items FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- 6. Garante a tabela de notificações de carrinho abandonado
CREATE TABLE IF NOT EXISTS abandoned_cart_notifications (
  id serial primary key,
  user_id uuid references auth.users(id) on delete cascade,
  channel text check (channel in ('email', 'whatsapp')),
  items_snapshot jsonb,
  sent_at timestamptz default now(),
  recovered boolean default false
);

-- ============================================================
-- VERIFICAÇÃO: rode este SELECT depois pra confirmar que está tudo certo.
-- Deve retornar: constraint_name = cart_items_user_id_product_id_key
-- ============================================================
-- SELECT conname FROM pg_constraint
-- WHERE conrelid = 'cart_items'::regclass AND contype = 'u';

-- Migration: Carrinho abandonado — schema consolidado e idempotente
-- Rode no SQL Editor do Supabase Dashboard (https://supabase.com/dashboard/project/_/sql)
-- Seguro para re-executar (tudo com IF NOT EXISTS).

-- 1) first_added_at: quando o item entrou no carrinho (preservado em upserts)
ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS first_added_at timestamptz DEFAULT now();
UPDATE cart_items SET first_added_at = created_at WHERE first_added_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_cart_items_first_added ON cart_items(first_added_at);

-- 2) updated_at: ÚLTIMA ATIVIDADE REAL no carrinho (add/remove/qty).
--    Importante: o app agora seta updated_at explicitamente no POST /api/cart,
--    então não depende mais do trigger abaixo. Mantemos o trigger como redundância.
ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
UPDATE cart_items SET updated_at = first_added_at WHERE updated_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_cart_items_updated_at ON cart_items(updated_at);

CREATE OR REPLACE FUNCTION update_cart_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  -- Só atualiza updated_at se a aplicação não enviou um valor (mantém compat)
  IF NEW.updated_at IS NOT DISTINCT FROM OLD.updated_at THEN
    NEW.updated_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_cart_items_updated_at ON cart_items;
CREATE TRIGGER trg_cart_items_updated_at
  BEFORE UPDATE ON cart_items
  FOR EACH ROW EXECUTE FUNCTION update_cart_items_updated_at();

-- 3) service_role pode ler/escrever cart_items (para admin + cron)
DROP POLICY IF EXISTS "Service role full access on cart_items" ON cart_items;
CREATE POLICY "Service role full access on cart_items"
  ON cart_items FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 4) Tabela de notificações de carrinho abandonado
CREATE TABLE IF NOT EXISTS abandoned_cart_notifications (
  id serial PRIMARY KEY,
  user_id uuid NOT NULL,
  channel text NOT NULL CHECK (channel IN ('whatsapp', 'email')),
  sent_at timestamptz DEFAULT now(),
  items_snapshot jsonb,
  recovered boolean DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_abandoned_notif_user ON abandoned_cart_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_abandoned_notif_sent ON abandoned_cart_notifications(sent_at);

ALTER TABLE abandoned_cart_notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access on abandoned_cart_notifications" ON abandoned_cart_notifications;
CREATE POLICY "Service role full access on abandoned_cart_notifications"
  ON abandoned_cart_notifications FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 5) Backfill: para rows legadas onde updated_at foi "bumped" a cada page-load
--    (bug antigo do sync), recupere a data original a partir de first_added_at.
--    Assim carrinhos realmente antigos voltam a aparecer como abandonados.
UPDATE cart_items
SET updated_at = first_added_at
WHERE updated_at > now() - interval '3 hours'
  AND first_added_at < now() - interval '3 hours';

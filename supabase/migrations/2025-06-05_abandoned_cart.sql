-- Migration: Carrinho abandonado — updated_at + notificações
-- Rodar no SQL Editor do Supabase Dashboard

-- Adicionar updated_at no cart_items
ALTER TABLE cart_items ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_cart_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_cart_items_updated_at ON cart_items;
CREATE TRIGGER trg_cart_items_updated_at
  BEFORE UPDATE ON cart_items
  FOR EACH ROW EXECUTE FUNCTION update_cart_items_updated_at();

-- Tabela para rastrear notificações de carrinho abandonado enviadas
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

CREATE POLICY "Service role full access on abandoned_cart_notifications"
  ON abandoned_cart_notifications FOR ALL
  USING (auth.role() = 'service_role');

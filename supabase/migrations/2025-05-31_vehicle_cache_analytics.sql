-- Migration: Adicionar cache de compatibilidade e analytics de IA
-- Rodar no SQL Editor do Supabase Dashboard

-- ============================================
-- Cache de compatibilidade de veículos
-- ============================================
create table if not exists vehicle_compatibility_cache (
  id serial primary key,
  vehicle_brand text not null,
  vehicle_model text not null,
  vehicle_year text not null,
  cached_results jsonb not null,
  cache_key text unique not null,
  total_products int not null,
  created_at timestamptz default now(),
  expires_at timestamptz not null default (now() + interval '7 days'),
  hit_count int default 0
);

create index if not exists idx_vehicle_cache_key on vehicle_compatibility_cache(cache_key);
create index if not exists idx_vehicle_cache_expires on vehicle_compatibility_cache(expires_at);

-- RLS: leitura pública, escrita apenas service role
alter table vehicle_compatibility_cache enable row level security;

drop policy if exists "Public can read cache" on vehicle_compatibility_cache;
create policy "Public can read cache"
  on vehicle_compatibility_cache for select using (true);

drop policy if exists "Service role can write cache" on vehicle_compatibility_cache;
create policy "Service role can write cache"
  on vehicle_compatibility_cache for all using (auth.role() = 'service_role');

-- ============================================
-- Analytics de uso de IA
-- ============================================
create table if not exists ai_analytics (
  id serial primary key,
  session_id text,
  vehicle_brand text,
  vehicle_model text,
  vehicle_year text,
  model_used text not null,
  input_tokens int not null default 0,
  output_tokens int not null default 0,
  total_tokens int generated always as (input_tokens + output_tokens) stored,
  estimated_cost_usd numeric(10,6),
  response_time_ms int,
  cache_hit boolean default false,
  fallback_used boolean default false,
  products_analyzed int,
  created_at timestamptz default now()
);

create index if not exists idx_ai_analytics_created on ai_analytics(created_at);
create index if not exists idx_ai_analytics_brand on ai_analytics(vehicle_brand);
create index if not exists idx_ai_analytics_cache_hit on ai_analytics(cache_hit);

-- RLS: leitura/escrita por service role
alter table ai_analytics enable row level security;

drop policy if exists "Service role full access" on ai_analytics;
create policy "Service role full access"
  on ai_analytics for all using (auth.role() = 'service_role');

-- Função para limpar cache expirado
create or replace function cleanup_expired_cache()
returns void as $$
begin
  delete from vehicle_compatibility_cache
  where expires_at < now();
end;
$$ language plpgsql;
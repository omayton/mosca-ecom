-- ============================================
-- Mosca Branca Parts — Schema Supabase
-- Rodar no SQL Editor do Supabase Dashboard
-- ============================================

-- 1. Tabela de produtos
create table products (
  id serial primary key,
  slug text unique not null,
  name text not null,
  price numeric(10,2) not null,
  old_price numeric(10,2),
  category text not null,
  category_slug text not null,
  image_file text not null default 'placeholder',
  description text,
  weight text,
  dimensions text,
  in_stock boolean default true,
  featured boolean default false,
  created_at timestamptz default now()
);

-- 2. Tabela de perfis (extends auth.users)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  phone text,
  address_json jsonb,
  created_at timestamptz default now()
);

-- 3. Carrinho
create table cart_items (
  id serial primary key,
  user_id uuid references auth.users(id) on delete cascade,
  product_id int references products(id),
  quantity int default 1 check (quantity > 0),
  created_at timestamptz default now(),
  unique(user_id, product_id)
);

-- 4. Pedidos
create table orders (
  id serial primary key,
  user_id uuid references auth.users(id),
  status text default 'pending' check (status in ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  total numeric(10,2) not null,
  shipping_cost numeric(10,2),
  shipping_method text,
  address_json jsonb,
  cpf text,
  payment_id text,
  payment_method text,
  mercadopago_preference_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 5. Itens do pedido
create table order_items (
  id serial primary key,
  order_id int references orders(id) on delete cascade,
  product_id int references products(id),
  quantity int not null check (quantity > 0),
  unit_price numeric(10,2) not null
);

-- ============================================
-- Row Level Security (RLS)
-- ============================================

-- Products: leitura pública
alter table products enable row level security;
create policy "Products are viewable by everyone"
  on products for select using (true);

-- Profiles: cada usuário acessa apenas o seu
alter table profiles enable row level security;
create policy "Users can view own profile"
  on profiles for select using (auth.uid() = id);
create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);
create policy "Users can insert own profile"
  on profiles for insert with check (auth.uid() = id);

-- Cart: cada usuário acessa apenas seus itens
alter table cart_items enable row level security;
create policy "Users can view own cart"
  on cart_items for select using (auth.uid() = user_id);
create policy "Users can insert own cart items"
  on cart_items for insert with check (auth.uid() = user_id);
create policy "Users can update own cart items"
  on cart_items for update using (auth.uid() = user_id);
create policy "Users can delete own cart items"
  on cart_items for delete using (auth.uid() = user_id);

-- Orders: cada usuário vê apenas seus pedidos
alter table orders enable row level security;
create policy "Users can view own orders"
  on orders for select using (auth.uid() = user_id);
create policy "Users can insert own orders"
  on orders for insert with check (auth.uid() = user_id);

-- Order items: acesso via pedido do usuário
alter table order_items enable row level security;
create policy "Users can view own order items"
  on order_items for select using (
    exists (select 1 from orders where orders.id = order_items.order_id and orders.user_id = auth.uid())
  );
create policy "Users can insert own order items"
  on order_items for insert with check (
    exists (select 1 from orders where orders.id = order_items.order_id and orders.user_id = auth.uid())
  );

-- ============================================
-- Trigger: criar perfil automaticamente ao registrar
-- ============================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Projeto

E-commerce de peças automotivas raras (Mosca Branca Parts). Single-store com catálogo no Supabase, autenticação, carrinho persistente e cálculo de frete via Melhor Envio.

- **URL produção:** https://www.moscabrancaparts.com.br
- **Stack:** Next.js 14.2 (App Router) + Tailwind CSS 3.4 + TypeScript 5 + Supabase
- **Deploy:** Vercel (auto-deploy on push to `main`)
- **No test framework configured** — no jest/vitest/playwright in the project

## Comandos

```bash
npm run dev      # Dev server localhost:3000
npm run build    # Build de produção (use para validar antes de push)
npm run lint     # ESLint (next lint)
npm run start    # Serve o build de produção localmente
```

## Arquitetura

### Rendering strategy
- Home (`src/app/page.tsx`) — async server component, busca produtos do Supabase com `revalidate = 60`
- Product pages (`src/app/produto/[slug]/page.tsx`) — ISR via `generateStaticParams()` + `revalidate = 60`
- Shipping calculator (`src/components/shipping-calculator.tsx`) — client component
- API routes under `src/app/api/` — serverless functions on Vercel

### Banco de dados (Supabase)
- **Tabelas:** `products`, `profiles`, `cart_items`, `orders`, `order_items`
- **Schema:** `supabase/schema.sql` (inclui RLS policies e trigger de criação de perfil)
- **Seed:** `supabase/seed.sql` (20 produtos iniciais)

### Supabase clients (3 variantes — usar a correta)
- `src/lib/supabase.ts` — singleton genérico sem auth. Usar em server components e `products-db.ts` queries.
- `src/lib/supabase-browser.ts` — singleton `"use client"` (export: `supabaseBrowser`). Usar em client components que precisam de Supabase diretamente.
- `src/lib/supabase-server.ts` — cria client com `cookies()` para ler sessão do usuário. Usar em API routes e server components que precisam do user autenticado (`getUser()`, `createServerSupabase()`).

### Catálogo — dual data source
O catálogo tem duas fontes de dados que coexistem:
- `src/lib/products-db.ts` — queries async ao Supabase (fonte primária, usada pelas pages)
- `src/lib/products.ts` — array estático `PRODUCTS[]` + helpers de formatação (`pixPrice`, `installmentPrice`, `fmt`, `parseWeight`, `parseDimensions`, `imgUrl`, `getProductBySlug`, `getRelated`)

As pages usam `products-db.ts` para dados. Os helpers de formatação e a interface `Product` vivem em `products.ts`. O array estático `PRODUCTS` é legado/fallback — novos produtos vão apenas no Supabase.

### Autenticação
- Login/registro via email+senha (Supabase Auth)
- Sessão gerenciada via cookies httpOnly (`sb-access-token`, `sb-refresh-token`)
- Middleware (`src/middleware.ts`) faz refresh automático de sessão; exclui `/api/shipping` e `/api/webhooks` do matcher
- Auth guard: paths `/checkout` e `/minha-conta` redirecionam para `/login?redirect={path}` se não autenticado
- Login form lê `?redirect=` e redireciona após sucesso
- API routes: `/api/auth/login`, `/api/auth/register`, `/api/auth/logout`, `/api/auth/me`
- Componente `AuthStatus` no header mostra estado de login
- Pages de auth: `src/app/(auth)/login/`, `src/app/(auth)/registro/` (route group sem layout extra)

### Carrinho
- `CartProvider` (`src/contexts/cart-context.tsx`) wraps o app no root layout
- Persistência via localStorage (key: `mosca-cart`), apenas para anônimos
- Drawer lateral abre automaticamente ao adicionar item (`setIsOpen(true)`)
- Badge com contador no header (desktop e mobile)

### Melhor Envio (Frete)
- OAuth flow: `/api/shipping/auth` → redirect → `/api/shipping/callback` → token salvo como env var
- Cálculo: `POST /api/shipping/calculate` tenta produção primeiro, fallback para sandbox se 401/403
- Token expira em 30 dias — renovar via OAuth flow
- Debug endpoint: `/api/shipping/debug`

### Checkout (Transparente MercadoPago)
- Página: `src/app/checkout/page.tsx` — server wrapper com `dynamic = "force-dynamic"`, importa `checkout-client.tsx`
- Client: `src/app/checkout/checkout-client.tsx` — client component com 3 steps (endereço → frete → pagamento)
- Step 1 (Endereço): `src/components/checkout/address-form.tsx` — CEP auto-fill via `/api/address/cep` (proxy ViaCEP), campos de endereço + telefone + CPF, salva no perfil
- Step 2 (Frete): `src/components/checkout/shipping-selector.tsx` — reutiliza `/api/shipping/calculate`, agrega itens em pacote
- Step 3 (Pagamento): `src/components/checkout/payment-form.tsx` — tabs Cartão/PIX inline
  - Cartão: SDK JS do MercadoPago tokeniza no client → `POST /api/payments` processa
  - PIX: `POST /api/payments` gera QR code → exibe na página
- Flow: endereço → frete → `POST /api/checkout` (cria pedido) → mostra payment form → pagamento → redirect `/pedido/{id}`
- `src/lib/mercadopago.ts` — helpers `createCardPayment`, `createPixPayment`, `getPayment` (REST API direta, sem SDK Node)

### Pedidos e Conta do Usuário
- Confirmação: `src/app/pedido/[id]/page.tsx` — server component, mostra status do pagamento
- Área do usuário: `src/app/minha-conta/` com layout + sidebar
  - Perfil: `src/app/minha-conta/page.tsx` — edita nome, telefone, endereço (via `PATCH /api/profile`)
  - Histórico: `src/app/minha-conta/pedidos/page.tsx` — lista pedidos
  - Detalhe: `src/app/minha-conta/pedidos/[id]/page.tsx` — pedido completo
- Webhook: `POST /api/webhooks/mercadopago` — recebe IPN, atualiza status do pedido via service role key

### Componentes UI
- `src/components/automotive/` — componentes de página (header, hero, product section, promo banners, add-to-cart)
- `src/components/cart/` — drawer, button, item, summary
- `src/components/auth/` — login-form, register-form, auth-status, user-menu
- `src/components/checkout/` — address-form, checkout-steps, shipping-selector, order-summary, payment-form
- `src/components/ui/` — primitivos base (button, card) usando class-variance-authority
- `src/components/ui-ux-pro-max/` — componentes gerados pela skill UI/UX Pro Max (accordion, slider, toast, mega-menu, newsletter-form)

## Design System

**Skill:** UI/UX Pro Max (`.claude/skills/ui-ux-pro-max/`)
**Master file:** `design-system/mosca-branca-parts/MASTER.md`

### Paleta (o que está implementado no código)

| Papel | Tailwind |
|-------|----------|
| Background | bg-[#FAFAFA] |
| Text | text-zinc-900 |
| CTA/Accent | bg-red-600 |
| PIX/Success | text-green-600 |
| Borders | border-zinc-100 (repouso), border-zinc-200 (hover) |

### Tipografia (implementada)

- **Inter** (`font-inter`, `--font-inter`) — body, labels, UI
- **Barlow Condensed** (`font-barlow`, `--font-barlow`) — preços, títulos hero

Nota: o MASTER.md sugere Syncopate + Space Mono, mas o código usa Inter + Barlow Condensed. Seguir o que está no código.

### Princípios visuais

- Bordas sutis (zinc-100), sombras leves (shadow-sm/md)
- Badges tintados: `bg-red-50 text-red-700` (não fundo sólido)
- Hover: escurecimento de borda + shadow-md (sem translate-y)
- Cantos: rounded-xl em cards, rounded-lg em inputs/botões
- Transições: 200-300ms, ease-out
- Touch targets: min 44x44px
- Ícones: Lucide React (nunca emojis como ícones)
- `cursor-pointer` em todo elemento clicável

### Header e Rodapé

Todas as páginas (incluindo checkout, minha conta, pedido) incluem:
- `TopHeader` — menu completo (logo, busca, categorias, carrinho, auth)
- Footer — com copyright e opções de pagamento
- Checkout tem adicionalmente uma barra verde "Compra Segura" abaixo do header (Compra Segura + Dados Protegidos + Pagamento Criptografado)

## Variáveis de ambiente

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://mcaxtwztzfrytxtkgdxh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...     # apenas server-side (webhook usa)

# Melhor Envio
MELHOR_ENVIO_CLIENT_ID
MELHOR_ENVIO_CLIENT_SECRET
MELHOR_ENVIO_TOKEN                # access_token JWT, expira em 30 dias
MELHOR_ENVIO_REFRESH_TOKEN
MELHOR_ENVIO_CEP_ORIGEM=38190000

# MercadoPago
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=...   # Public key para SDK JS (tokenização client-side)
MERCADOPAGO_ACCESS_TOKEN=...             # Access token para API server-side

# App
NEXT_PUBLIC_APP_URL=https://www.moscabrancaparts.com.br   # Base URL para webhooks e redirects (importante para MercadoPago IPN)
```

## Gotchas

### Vercel build & env vars
- **NUNCA** instanciar Supabase client no top-level de API routes — o Next.js avalia esses módulos em build time e as env vars podem não existir. Usar padrão lazy: `function getSupabase() { return createClient(...) }` e chamar dentro do handler.
- `NEXT_PUBLIC_*` vars são inlined pelo bundler em server components/pages (funcionam no top-level de `src/lib/supabase.ts`), mas **não** em API routes durante "page data collection".
- Todas as env vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `MERCADOPAGO_ACCESS_TOKEN`, `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY`, `MELHOR_ENVIO_*`, `NEXT_PUBLIC_APP_URL`) devem estar configuradas no Vercel dashboard (Settings → Environment Variables) para Production e Preview.
- Pages que usam `useSearchParams()` precisam de `<Suspense>` boundary para evitar prerender errors (ex: `/login`).
- Pages protegidas por auth que são `"use client"` precisam de wrapper server component com `export const dynamic = "force-dynamic"` (ex: `/checkout`).

### Dados e APIs
- `products.ts` has `parseWeight(str)` and `parseDimensions(str)` helpers that convert human-readable strings ("0,5 kg", "30×20×15 cm") to numeric values for the shipping API — always use these when building shipping payloads
- Supabase columns use `snake_case`, TypeScript interfaces use `camelCase` — the `rowToProduct()` mapper in `products-db.ts` handles conversion
- MercadoPago integration uses direct REST API calls (`src/lib/mercadopago.ts`), not the official Node SDK
- The middleware matcher excludes `/api/shipping` and `/api/webhooks` — these must remain unauthenticated for external callbacks

### Carrinho
- Cart state lives in localStorage only (no server sync for anonymous users) — the `CartProvider` in root layout hydrates on mount
- O `CartDrawer` é renderizado dentro do `TopHeader` — qualquer página que precise do carrinho deve incluir `<TopHeader />`
- Se o carrinho não responde a cliques em produção, verificar se há erro de hidratação (React não registra event handlers quando hidratação falha silenciosamente)
- Badge do carrinho usa `loaded` do CartContext para evitar hydration mismatch — só mostra contador após hidratação do localStorage

### RLS Supabase
- A tabela `order_items` precisa de policy de INSERT (não apenas SELECT) para o checkout funcionar
- SQL no `supabase/schema.sql`: policy "Users can insert own order items" on order_items for insert with check (exists select 1 from orders where orders.id = order_items.order_id and orders.user_id = auth.uid())

## Convenções

- Componentes client: `"use client"` no topo
- Páginas com dados do Supabase: async + `revalidate = 60`
- Imports com `@/` alias (mapeia para `src/`)
- `cn()` helper (clsx + tailwind-merge) em `src/lib/utils.ts` para merge de classes
- Commits em inglês, prefixo convencional: `feat:`, `fix:`, `style:`, `docs:`
- Nunca push direto em main sem `npm run build` passar
- Container max-width: 1280px, centrado, padding responsivo (definido em `tailwind.config.ts`)
- Imagens externas: domínio `moscabrancaparts.com.br` (configurado em `next.config.js` remotePatterns)
- Fontes carregadas via `next/font/google` no root layout, expostas como CSS variables

## Checklist pré-entrega

- `cursor-pointer` em elementos clicáveis
- Hover com transição suave (150-300ms)
- Contraste texto 4.5:1 mínimo
- Focus states visíveis
- Responsivo: 375px, 768px, 1024px, 1440px
- Sem scroll horizontal no mobile
- Build passa sem erros (`npm run build`)

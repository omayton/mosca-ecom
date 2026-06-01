# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Projeto

E-commerce de peças automotivas raras (Mosca Branca Parts). Single-store com catálogo no Supabase, autenticação, carrinho persistente, cálculo de frete via Melhor Envio, busca por veículo com IA e painel admin completo.

- **URL produção:** https://www.moscabrancaparts.com.br
- **Admin:** https://www.moscabrancaparts.com.br/admin
- **Stack:** Next.js 14.2 (App Router) + Tailwind CSS 3.4 + TypeScript 5 + Supabase
- **Deploy:** Vercel (auto-deploy on push to `main`)
- **IA:** Claude Haiku (compatibilidade veículos + copy banners) via Vercel AI Gateway
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
- Admin pages (`src/app/admin/`) — client components com layout próprio (sidebar dark)

### Banco de dados (Supabase)

**Tabelas:**
- `products` — catálogo (com stock_quantity, stock_threshold, status)
- `profiles` — dados do usuário (extends auth.users)
- `cart_items` — carrinho persistente
- `orders` — pedidos
- `order_items` — itens dos pedidos
- `banners` — banners do carrossel da home
- `coupons` — cupons de desconto
- `coupon_uses` — registro de uso de cupons
- `vehicle_compatibility_cache` — cache de análises IA (7 dias TTL)
- `ai_usage_analytics` — tracking de custos IA

**Schema:** `supabase/schema.sql` (inclui RLS policies e trigger de criação de perfil)
**Seed:** `supabase/seed.sql` (20 produtos iniciais)
**Migrations:** `supabase/migrations/` (stock, coupons, banners, cache, analytics, storage)

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
- **Admin NÃO tem auth guard** — TODO: implementar proteção

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

### Busca por Veículo (IA)
- Botão "Buscar com veículo" no header
- Autocomplete via Fipe API + fallback com 50+ veículos brasileiros
- Análise de compatibilidade via Claude Haiku (US$0.0012/busca)
- Cache persistente no Supabase (7 dias TTL, ~70-80% hit rate)
- Analytics de uso e custos
- Componentes: `src/components/vehicle/` (autocomplete, results, search-button, search-dropdown)
- API: `/api/vehicles/search`, `/api/vehicles/compatibility`
- Types: `src/lib/vehicle-types.ts`

### Sistema de Banners (IA)
- Banners dinâmicos gerenciados pelo admin
- Copy gerada por Claude Haiku (tag, título, subtítulo, CTA)
- Vinculação com produto (puxa foto e link automaticamente)
- Templates: Hero, Promoção, Lançamento, Categoria
- Cores customizáveis (fundo, destaque, texto)
- Preview ao vivo no formulário
- Carrossel na home busca banners ativos do Supabase (fallback para slides estáticos)
- `mix-blend-mode: multiply` para remover fundo branco de fotos
- API: `/api/admin/banners`, `/api/admin/banners/generate-copy`

### Controle de Estoque
- Campos: `stock_quantity`, `stock_threshold`, `status`
- Status automático via trigger PostgreSQL:
  - `available`: stock > threshold
  - `low_stock`: 0 < stock <= threshold
  - `out_of_stock`: stock = 0
  - `discontinued`: manual
- API: `/api/admin/stock` (GET/PATCH)

### Sistema de Cupons
- Tipos: porcentagem ou valor fixo
- Regras: pedido mínimo, máx usos total, máx usos por usuário, expiração
- Tabelas: `coupons`, `coupon_uses`
- API: `/api/admin/coupons` (CRUD)

### Painel Admin (`/admin`)
- **Layout:** Dark theme (#0a0a0b) com sidebar fixa e accent âmbar
- **Dashboard:** `/admin` — métricas, gráfico receita, ações rápidas, status bar
- **Banners:** `/admin/banners` — CRUD com preview ao vivo + geração IA
- **Produtos:** `/admin/produtos` — CRUD, busca, filtros, upload de imagem
- **Estoque:** `/admin/estoque` — controle visual, botões rápidos, filtros por status
- **Cupons:** `/admin/cupons` — criar/editar, ativar/desativar, cards com stats
- **Pedidos:** `/admin/pedidos` — listar, filtrar, atualizar status
- **Clientes:** `/admin/clientes` — lista, busca, endereço, contagem pedidos
- **Analytics IA:** `/admin/analytics` — custos, tokens, cache hits

### Upload de Imagens
- Supabase Storage bucket: `product-images`
- Drag & drop ou clique para upload
- Validação: JPG, PNG, WebP, GIF (máx 5MB)
- Preview em tempo real
- API: `/api/admin/upload` (POST/DELETE)
- Componente: `src/components/admin/image-upload.tsx`

### Pedidos e Conta do Usuário
- Confirmação: `src/app/pedido/[id]/page.tsx` — server component, mostra status do pagamento
- Área do usuário: `src/app/minha-conta/` com layout + sidebar
  - Perfil: `src/app/minha-conta/page.tsx` — edita nome, telefone, endereço (via `PATCH /api/profile`)
  - Histórico: `src/app/minha-conta/pedidos/page.tsx` — lista pedidos
  - Detalhe: `src/app/minha-conta/pedidos/[id]/page.tsx` — pedido completo
- Webhook: `POST /api/webhooks/mercadopago` — recebe IPN, atualiza status do pedido via service role key

### Componentes UI
- `src/components/automotive/` — componentes de página (header, hero-carousel, product section, promo banners, add-to-cart)
- `src/components/cart/` — drawer, button, item, summary
- `src/components/auth/` — login-form, register-form, auth-status, user-menu
- `src/components/checkout/` — address-form, checkout-steps, shipping-selector, order-summary, payment-form
- `src/components/vehicle/` — autocomplete, results, search-button, search-dropdown
- `src/components/admin/` — admin-sidebar, image-upload
- `src/components/analytics/` — ai-dashboard
- `src/components/ui/` — primitivos base (button, card) usando class-variance-authority
- `src/components/ui-ux-pro-max/` — componentes gerados pela skill UI/UX Pro Max

## Design System

### Loja (Frontend Público)

| Papel | Tailwind |
|-------|----------|
| Background | bg-[#FAFAFA] |
| Text | text-zinc-900 |
| CTA/Accent | bg-red-600 |
| PIX/Success | text-green-600 |
| Borders | border-zinc-100 (repouso), border-zinc-200 (hover) |

### Admin (Dashboard)

| Papel | Valor |
|-------|-------|
| Background | #0a0a0b |
| Cards | #111113 |
| Borders | white/[0.06] |
| Accent | amber-400/500 (gradients) |
| Text | white/90 (primary), white/40 (secondary) |
| Active nav | amber glow + left bar indicator |

### Tipografia

- **Inter** (`font-inter`, `--font-inter`) — body, labels, UI
- **Barlow Condensed** (`font-barlow`, `--font-barlow`) — preços, títulos hero

### Princípios visuais

- Bordas sutis (zinc-100), sombras leves (shadow-sm/md)
- Badges tintados: `bg-red-50 text-red-700` (não fundo sólido)
- Hover: escurecimento de borda + shadow-md (sem translate-y)
- Cantos: rounded-xl em cards, rounded-lg em inputs/botões
- Transições: 200-300ms, ease-out
- Touch targets: min 44x44px
- Ícones: Lucide React (nunca emojis como ícones)
- `cursor-pointer` em todo elemento clicável

## Variáveis de ambiente

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://mcaxtwztzfrytxtkgdxh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...     # apenas server-side

# Melhor Envio
MELHOR_ENVIO_CLIENT_ID
MELHOR_ENVIO_CLIENT_SECRET
MELHOR_ENVIO_TOKEN                # access_token JWT, expira em 30 dias
MELHOR_ENVIO_REFRESH_TOKEN
MELHOR_ENVIO_CEP_ORIGEM=38190000

# MercadoPago
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=...
MERCADOPAGO_ACCESS_TOKEN=...

# IA (Claude via Vercel AI Gateway)
VERCEL_AI_GATEWAY_URL=...         # Gateway URL para chamadas IA
ANTHROPIC_API_KEY=...             # API key Anthropic

# App
NEXT_PUBLIC_APP_URL=https://www.moscabrancaparts.com.br
```

## API Routes

### Públicas
- `GET /api/vehicles/search?q=` — busca veículos (Fipe + fallback)
- `POST /api/vehicles/compatibility` — análise IA de compatibilidade
- `POST /api/shipping/calculate` — cálculo de frete
- `GET /api/address/cep?cep=` — consulta CEP (ViaCEP)
- `POST /api/payments` — processar pagamento
- `POST /api/checkout` — criar pedido
- `POST /api/webhooks/mercadopago` — IPN webhook

### Admin
- `GET /api/admin/dashboard` — métricas gerais
- `GET/POST/PATCH/DELETE /api/admin/products` — CRUD produtos
- `GET/PATCH /api/admin/stock` — controle estoque
- `GET/POST/PATCH/DELETE /api/admin/banners` — CRUD banners
- `POST /api/admin/banners/generate-copy` — gerar copy IA
- `GET/POST/PATCH/DELETE /api/admin/coupons` — CRUD cupons
- `GET/PATCH /api/admin/orders` — pedidos
- `GET /api/admin/customers` — clientes
- `POST/DELETE /api/admin/upload` — upload imagens
- `GET /api/analytics/ai-usage` — analytics IA

## Bugs Conhecidos / TODO

- [ ] `/loja` não existe como rota (precisa criar ou redirecionar)
- [ ] Menu de categorias não é clicável (links com `href="#"`)
- [ ] "Informe CEP" no header não funciona (precisa modal/popup)
- [ ] Admin não tem autenticação (qualquer pessoa acessa `/admin`)
- [ ] Busca do header não tem funcionalidade real (só captura texto)
- [ ] Imagens de produtos apontam para URL WordPress que pode não existir
- [ ] Faturamento no admin mostra dados zerados se tabelas não existem no Supabase

## Gotchas

### Vercel build & env vars
- **NUNCA** instanciar Supabase client no top-level de API routes — o Next.js avalia esses módulos em build time e as env vars podem não existir. Usar padrão lazy: `function getSupabase() { return createClient(...) }` e chamar dentro do handler.
- `NEXT_PUBLIC_*` vars são inlined pelo bundler em server components/pages (funcionam no top-level de `src/lib/supabase.ts`), mas **não** em API routes durante "page data collection".
- Todas as env vars devem estar configuradas no Vercel dashboard (Settings → Environment Variables) para Production e Preview.
- Pages que usam `useSearchParams()` precisam de `<Suspense>` boundary para evitar prerender errors.
- Pages protegidas por auth que são `"use client"` precisam de wrapper server component com `export const dynamic = "force-dynamic"`.

### Dados e APIs
- `products.ts` has `parseWeight(str)` and `parseDimensions(str)` helpers that convert human-readable strings ("0,5 kg", "30×20×15 cm") to numeric values for the shipping API
- Supabase columns use `snake_case`, TypeScript interfaces use `camelCase` — the `rowToProduct()` mapper in `products-db.ts` handles conversion
- MercadoPago integration uses direct REST API calls (`src/lib/mercadopago.ts`), not the official Node SDK
- The middleware matcher excludes `/api/shipping` and `/api/webhooks` — these must remain unauthenticated for external callbacks

### Carrinho
- Cart state lives in localStorage only (no server sync for anonymous users) — the `CartProvider` in root layout hydrates on mount
- O `CartDrawer` é renderizado dentro do `TopHeader` — qualquer página que precise do carrinho deve incluir `<TopHeader />`
- Badge do carrinho usa `loaded` do CartContext para evitar hydration mismatch

### RLS Supabase
- A tabela `order_items` precisa de policy de INSERT (não apenas SELECT) para o checkout funcionar
- Banners: policy pública para SELECT (is_active = true), service_role para ALL
- Coupons: policy pública para SELECT (is_active = true), service_role para ALL

### Imagens de Produtos
- Imagens podem vir de 2 fontes:
  - URL completa (Supabase Storage): `https://mcaxtwztzfrytxtkgdxh.supabase.co/storage/v1/...`
  - Nome de arquivo legado (WordPress): prefixado com `https://www.moscabrancaparts.com.br/wp-content/uploads/2026/04/`
- Lógica: se `image_file.startsWith('http')` → usar direto, senão → prefixar com URL WordPress
- Upload novo vai para Supabase Storage (bucket `product-images`)

### Proxy/Network (Desenvolvimento)
- Ambiente local tem proxy HTTP em localhost:59454 que bloqueia `git push`
- Solução: fazer push manualmente no terminal ou usar `vercel --prod` para deploy direto
- Node.js v26.0.0 (instável) pode causar erros de permissão — recomendado usar Node 20 LTS

## Convenções

- Componentes client: `"use client"` no topo
- Páginas com dados do Supabase: async + `revalidate = 60`
- Imports com `@/` alias (mapeia para `src/`)
- `cn()` helper (clsx + tailwind-merge) em `src/lib/utils.ts` para merge de classes
- Commits em inglês, prefixo convencional: `feat:`, `fix:`, `style:`, `docs:`
- Nunca push direto em main sem `npm run build` passar
- Container max-width: 1280px, centrado, padding responsivo (definido em `tailwind.config.ts`)
- Imagens externas: domínio `moscabrancaparts.com.br` e Supabase (configurado em `next.config.js` remotePatterns)
- Fontes carregadas via `next/font/google` no root layout, expostas como CSS variables
- Admin: dark theme, accent amber, sidebar fixa 64px colapsável
- IA: sempre Claude Haiku para custo baixo, com fallback se API falhar

## Checklist pré-entrega

- `cursor-pointer` em elementos clicáveis
- Hover com transição suave (150-300ms)
- Contraste texto 4.5:1 mínimo
- Focus states visíveis
- Responsivo: 375px, 768px, 1024px, 1440px
- Sem scroll horizontal no mobile
- Build passa sem erros (`npm run build`)
- Imagens com fallback se URL quebrada
- APIs com try/catch e fallback graceful
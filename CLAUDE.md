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

### Páginas Institucionais
- `src/app/(institucional)/sobre/page.tsx` — Sobre a Mosca Branca (diferenciais, CTA WhatsApp)
- `src/app/(institucional)/politica-de-privacidade/page.tsx` — placeholder (precisa conteúdo real)
- `src/app/(institucional)/termos-de-uso/page.tsx` — placeholder (precisa conteúdo real)

### Header (`src/components/automotive/top-header.tsx`)
- Top bar com links funcionais: Sobre, Atendimento (WhatsApp), Rastrear Pedido, Meus Pedidos
- Barra principal: logo, busca (redireciona p/ `/loja?busca=`), CEP modal, auth status, carrinho
- Nav categorias: botão "Departamentos" com dropdown de todas as categorias + links rápidos p/ 6 primeiras + botão "Ofertas"
- Dropdown de departamentos é toggle (estado `deptOpen`)
- `categories` vem de DEFAULT_CATEGORIES ou fetch do Supabase

### Footer
- Footer global: `src/components/footer.tsx` — usado em `/loja`, `/produto/[slug]`, `/minha-conta`, `/sobre`
- Home tem footer próprio mais rico com logo, social links, categorias
- Todos os links no footer apontam para páginas reais (sem `href="#"`)

### Rendering strategy
- Home (`src/app/page.tsx`) — async server component, busca produtos do Supabase com `revalidate = 60`
- Product pages (`src/app/produto/[slug]/page.tsx`) — ISR via `generateStaticParams()` + `revalidate = 60`
- Shipping calculator (`src/components/shipping-calculator.tsx`) — client component
- API routes under `src/app/api/` — serverless functions on Vercel
- Admin pages (`src/app/admin/`) — client components com layout próprio (sidebar dark)

### Configuração de Deploy
- `vercel.json` — define cron jobs (abandoned cart: hourly)
- `next.config.js` — remotePatterns (imagens), security headers (CSP, HSTS, X-Frame-Options, etc.)

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
- `admin_audit_log` — audit trail de ações admin

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

**`imgUrl(file)`:** Se `file.startsWith('http')` retorna direto (Supabase Storage), senão prefixa com URL WordPress. Se vazio/placeholder retorna imagem placeholder.

### Autenticação
- Login/registro via email+senha (Supabase Auth)
- Sessão gerenciada via cookies httpOnly (`sb-access-token`, `sb-refresh-token`)
- Middleware (`src/middleware.ts`) faz refresh automático de sessão; skip getUser() em paths não-protegidos para performance
- Auth guard: paths `/checkout` e `/minha-conta` redirecionam para `/login?redirect={path}` se não autenticado
- Login form lê `?redirect=` e redireciona após sucesso
- API routes: `/api/auth/login`, `/api/auth/register`, `/api/auth/logout`, `/api/auth/me`
- Componente `AuthStatus` no header mostra estado de login com dropdown (Minha conta, Meus pedidos, Sair)
- Pages de auth: `src/app/(auth)/login/`, `src/app/(auth)/registro/`, `src/app/(auth)/redefinir-senha/`, `src/app/(auth)/esqueci-senha/`
- **Admin protegido:** `requireAdmin()` helper (`src/lib/require-admin.ts`) verifica cookie + ADMIN_EMAILS em TODAS as API routes admin
- Middleware também bloqueia `/admin` UI para não-admins via ADMIN_EMAILS env var

### Carrinho
- `CartProvider` (`src/contexts/cart-context.tsx`) wraps o app no root layout (é o único provider no layout — não há header/footer compartilhado, cada page inclui `<TopHeader />` individualmente)
- Persistência dual: localStorage (key: `mosca-cart`) + Supabase `cart_items` para usuários logados
- Server sync: on mount, fetches `/api/cart` — merges server + local items; debounced POST sync on changes (1s delay)
- Para anônimos: apenas localStorage
- Drawer lateral abre automaticamente ao adicionar item (`setIsOpen(true)`)
- Badge com contador no header (desktop e mobile)

### Carrinho Abandonado
- Cron job via Vercel: `GET /api/cron/abandoned-cart` — roda a cada hora (`vercel.json` crons)
- Protegido por `CRON_SECRET` (header `Authorization: Bearer {secret}`)
- Detecta carrinhos com `updated_at` > 2 horas sem checkout
- Envia email de recuperação via Resend (`src/lib/email.ts`)
- Admin: `/admin/carrinhos-abandonados` — painel para visualizar e gerenciar
- Tabela `cart_items` já usada — filtra por tempo de inatividade

### Email (Resend)
- `src/lib/email.ts` — wrapper para Resend API
- Graceful fallback: se `RESEND_API_KEY` não configurada, loga warning e retorna false
- Usado pelo cron de carrinho abandonado

### Audit Log
- `src/lib/audit-log.ts` — registra ações admin na tabela `admin_audit_log`
- Non-blocking: erros são engolidos para não quebrar o fluxo principal
- Campos: userId, userEmail, action, entityType, entityId, details, ipAddress

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
- **Dashboard:** `/admin` — métricas REAIS (receita semanal, trend vs semana anterior, gráfico diário, últimos pedidos, estoque baixo). Nenhum dado fake/hardcoded.
- **Banners:** `/admin/banners` — CRUD com preview ao vivo + geração IA
- **Produtos:** `/admin/produtos` — CRUD, busca, filtros, upload de imagem
- **Estoque:** `/admin/estoque` — controle visual, botões rápidos, filtros por status
- **Cupons:** `/admin/cupons` — criar/editar, ativar/desativar, cards com stats
- **Carrinhos Abandonados:** `/admin/carrinhos-abandonados` — visualizar e recuperar carrinhos
- **Pedidos:** `/admin/pedidos` — listar, filtrar, atualizar status
- **Clientes:** `/admin/clientes` — lista, busca, endereço, contagem pedidos
- **Avaliações:** `/admin/avaliacoes` — moderação de reviews de produtos
- **Categorias:** `/admin/categorias` — gerenciamento de categorias
- **Relatórios:** `/admin/relatorios` — relatórios do negócio
- **Analytics IA:** `/admin/analytics` — custos, tokens, cache hits (tabela: `ai_usage_analytics`)
- **Segurança:** Todas as APIs admin usam `requireAdmin()` — verifica cookie de sessão + email na lista ADMIN_EMAILS

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
  - Pedidos: `src/app/minha-conta/pedidos/page.tsx` — lista pedidos
  - Detalhe: `src/app/minha-conta/pedidos/[id]/page.tsx` — pedido completo
  - Alterar Senha: `src/app/minha-conta/senha/page.tsx` — troca senha via Supabase Auth
- Webhook: `POST /api/webhooks/mercadopago` — recebe IPN, atualiza status do pedido via service role key

### Componentes UI
- `src/components/automotive/` — componentes de página (header, hero-carousel, product section, promo banners, add-to-cart)
- `src/components/cart/` — drawer, button, item, summary
- `src/components/auth/` — login-form, register-form, auth-status (dropdown com Minha conta, Pedidos, Sair)
- `src/components/checkout/` — address-form, checkout-steps, shipping-selector, order-summary, payment-form
- `src/components/vehicle/` — autocomplete, results, search-button, search-dropdown
- `src/components/admin/` — admin-sidebar, image-upload
- `src/components/analytics/` — ai-dashboard
- `src/components/cep/` — cep-modal (modal de CEP no header)
- `src/components/footer.tsx` — footer global reutilizável (institucional, conta, contato, WhatsApp)
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

# Email (Resend)
RESEND_API_KEY=...                # API key do Resend para envio de emails
EMAIL_FROM=Mosca Branca Parts <noreply@moscabrancaparts.com.br>

# Cron
CRON_SECRET=...                   # secret para proteger endpoints de cron (Vercel Cron)

# App
NEXT_PUBLIC_APP_URL=https://www.moscabrancaparts.com.br
ADMIN_EMAILS=email1@example.com,email2@example.com   # emails autorizados no admin (comma-separated)
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
- `GET/POST /api/cart` — sync carrinho (usuários logados)
- `GET /api/cron/abandoned-cart` — cron job notificação carrinho abandonado (protegido por CRON_SECRET)

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
- `GET/POST/PATCH/DELETE /api/categories` — CRUD categorias
- `GET/POST /api/reviews` — avaliações de produtos

## Bugs Conhecidos / TODO

- [x] ~~`/loja` não existe como rota~~ — criada e funcional
- [x] ~~Menu de categorias não é clicável~~ — dropdown de departamentos funcional
- [x] ~~"Informe CEP" no header não funciona~~ — CepModal funcional
- [x] ~~Admin não tem autenticação~~ — `requireAdmin()` em todas as APIs
- [x] ~~Busca do header não tem funcionalidade real~~ — redireciona para `/loja?busca=`
- [x] ~~Imagens de produtos apontam para URL WordPress~~ — `imgUrl()` trata URLs completas
- [x] ~~Faturamento no admin mostra dados zerados~~ — API retorna dados reais com trends
- [x] ~~`next.config.js` remotePatterns falta hostname do Supabase Storage~~ — já configurado
- [ ] Redes sociais no footer da home apontam para `#` (faltam URLs reais)
- [ ] Página `/politica-de-privacidade` e `/termos-de-uso` precisam de conteúdo real
- [ ] Melhor Envio token expira em 30 dias — automatizar renovação
- [ ] Reviews de produto: formulário público de avaliação não existe ainda (só admin modera)
- [ ] Busca por veículo: ainda não integrada ao header (componente existe mas não aparece)

## Gotchas

### Vercel build & env vars
- **NUNCA** instanciar Supabase client no top-level de API routes — o Next.js avalia esses módulos em build time e as env vars podem não existir. Usar padrão lazy: `function getSupabase() { return createClient(...) }` e chamar dentro do handler.
- `NEXT_PUBLIC_*` vars são inlined pelo bundler em server components/pages (funcionam no top-level de `src/lib/supabase.ts`), mas **não** em API routes durante "page data collection".
- Todas as env vars devem estar configuradas no Vercel dashboard (Settings → Environment Variables) para Production e Preview.
- Pages que usam `useSearchParams()` precisam de `<Suspense>` boundary para evitar prerender errors.
- Pages protegidas por auth que são `"use client"` precisam de wrapper server component com `export const dynamic = "force-dynamic"`.

### Dados e APIs
- `products.ts` has `parseWeight(str)` and `parseDimensions(str)` helpers that convert human-readable strings ("0,5 kg", "30×20×15 cm") to numeric values for the shipping API. Defaults when missing: weight=0.3kg, dimensions=16×10×10cm
- Supabase columns use `snake_case`, TypeScript interfaces use `camelCase` — the `rowToProduct()` mapper in `products-db.ts` handles conversion
- MercadoPago integration uses direct REST API calls (`src/lib/mercadopago.ts`), not the official Node SDK
- The middleware matcher excludes `/api/shipping`, `/api/webhooks`, and `/api/cron` — these must remain unauthenticated for external callbacks

### Carrinho
- Cart state lives in localStorage + Supabase `cart_items` (dual persistence)
- Anonymous users: localStorage only. Logged-in users: merge on mount, debounced sync to server via `/api/cart`
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
- Lógica em `imgUrl()`: se `file.startsWith('http')` → usar direto, senão → prefixar com URL WordPress
- Upload novo vai para Supabase Storage (bucket `product-images`)
- `next.config.js` remotePatterns inclui `moscabrancaparts.com.br` e `mcaxtwztzfrytxtkgdxh.supabase.co` para `next/image` otimizado

### Rate Limiting
- `src/lib/rate-limit.ts` — rate limiter in-memory com lazy cleanup (sem setInterval/timer leak)
- Cleanup ativa apenas quando store > 100 entries e a cada 60s
- Usado em APIs sensíveis (login, registro)

### SEO
- Root layout: metadata completo com `title.template`, Open Graph, Twitter Cards, robots
- Produto: metadata dinâmico com OG image, preço na description
- Home: Schema.org Organization + WebSite com SearchAction
- Sitemap: `src/app/sitemap.ts` — gera URLs de páginas estáticas + todos os produtos dinâmicos
- `robots.ts`: permite indexação completa

### Proxy/Network (Desenvolvimento)
- Claude Code configura proxy HTTP (localhost:53280) que bloqueia `git push` e `vercel --prod`
- Solução: abrir terminal separado, rodar `unset HTTP_PROXY HTTPS_PROXY http_proxy https_proxy` e então `git push origin main`
- Deploy é automático na Vercel ao push para main

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
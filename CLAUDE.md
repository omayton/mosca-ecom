# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Projeto

E-commerce de peças automotivas raras (Mosca Branca Parts). Single-store com catálogo no Supabase, autenticação, carrinho persistente, cálculo de frete via Melhor Envio, busca por veículo com IA e painel admin completo.

- **URL produção:** https://www.moscabrancaparts.com.br
- **Admin:** https://www.moscabrancaparts.com.br/admin
- **Stack:** Next.js 14.2 (App Router) + Tailwind CSS 3.4 + TypeScript 5 + Supabase
- **Deploy:** Vercel (auto-deploy on push to `main`)
- **IA:** Claude Haiku (compatibilidade veículos + copy banners) via Vercel AI Gateway
- **Analytics:** GA4 (G-5CRHKEJH7F) via GTM dataLayer + Vercel Web Analytics
- **No test framework configured** — no jest/vitest/playwright in the project

## Comandos

```bash
npm run dev      # Dev server localhost:3000
npm run build    # Build de produção (use para validar antes de push)
npm run lint     # ESLint (next lint)
npm run start    # Serve o build de produção localmente
```

> **Build local:** requer `.env.local` com `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
> Sem elas, o build falha em páginas que chamam Supabase durante static generation.
> Para obter as vars: `vercel env pull .env.local` (puxa do ambiente development do Vercel).

## Arquitetura

### Páginas Institucionais
- `src/app/(institucional)/sobre/page.tsx` — Sobre a Mosca Branca (diferenciais, CTA WhatsApp)
- `src/app/(institucional)/politica-de-privacidade/page.tsx` — placeholder (precisa conteúdo real)
- `src/app/(institucional)/termos-de-uso/page.tsx` — placeholder (precisa conteúdo real)

### Header (`src/components/automotive/top-header.tsx`)
- Promo bar vermelha (desktop): "5% OFF no PIX • Frete para todo o Brasil • Até 6x sem juros" + links (Sobre, Rastrear, WhatsApp)
- Barra principal: logo, vehicle search, busca (rounded-xl, fundo dark, ring vermelho no focus), CEP modal, auth status, carrinho
- Nav categorias: botão "Departamentos" (LayoutGrid icon) com dropdown + links rápidos p/ 6 primeiras (underline vermelho animado no hover) + pill "Ofertas"
- Mobile: drawer com busca embutida, WhatsApp como botão verde full-width, backdrop blur
- `categories` vem de DEFAULT_CATEGORIES ou fetch do Supabase

### Footer
- Footer global: `src/components/footer.tsx` — usado em `/loja`, `/produto/[slug]`, `/minha-conta`, `/sobre`
- Home tem footer próprio mais rico com logo, social links, categorias
- Todos os links no footer apontam para páginas reais (sem `href="#"`)

### Preloader
- `src/components/preloader.tsx` — `PreloaderRemover` client component que remove o preloader HTML do `layout.tsx` após mount
- O preloader é um fly animado com batida de asas (definido no `globals.css` / layout HTML)

### Rendering strategy
- Home (`src/app/page.tsx`) — async server component, busca produtos do Supabase com `revalidate = 60`
- Product pages (`src/app/produto/[slug]/page.tsx`) — ISR via `generateStaticParams()` + `revalidate = 60`
- Shipping calculator (`src/components/shipping-calculator.tsx`) — client component
- API routes under `src/app/api/` — serverless functions on Vercel
- Admin pages (`src/app/admin/`) — client components com layout próprio (sidebar dark)

### Configuração de Deploy
- `vercel.json` — define cron jobs (abandoned cart: daily 9h — Hobby plan limit)
- `next.config.js` — remotePatterns (imagens), security headers (CSP, HSTS, X-Frame-Options, etc.), sharp externals

### Banco de dados (Supabase)

**Tabelas:**
- `products` — catálogo (com stock_quantity, stock_threshold, status)
- `profiles` — dados do usuário: `id`, `name`, `phone`, `address_json`, `created_at` (**não tem `email` nem `full_name`**)
- `cart_items` — carrinho persistente (com `first_added_at` para rastreamento de abandono)
- `orders` — pedidos
- `order_items` — itens dos pedidos
- `banners` — banners do carrossel da home
- `coupons` — cupons de desconto (campo `show_on_product` para exibir na página do produto)
- `coupon_uses` — registro de uso de cupons
- `product_images` — imagens extras dos produtos (multi-imagem, ordenação)
- `product_reviews` — reviews de clientes (rating, comment, verified purchase)
- `vehicle_compatibility_cache` — cache de análises IA (7 dias TTL)
- `ai_usage_analytics` — tracking de custos IA
- `admin_audit_log` — audit trail de ações admin

**Schema:** `supabase/schema.sql` (inclui RLS policies e trigger de criação de perfil)
**Seed:** `supabase/seed.sql` (20 produtos iniciais)
**Migrations:** `supabase/migrations/` (stock, coupons, banners, cache, analytics, storage, reviews, product images, cart tracking)

**Trigger `handle_new_user`:** ao criar usuário, insere `id` + `name` (de `raw_user_meta_data->>'name'`) no profiles.
O trigger foi corrigido — versão anterior só inseria o `id`, deixando `name = NULL`.
SQL para retroativamente preencher nomes:
```sql
UPDATE public.profiles p
SET name = COALESCE(
  (SELECT raw_user_meta_data->>'name' FROM auth.users WHERE id = p.id),
  (SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = p.id)
)
WHERE p.name IS NULL;
```

### Supabase clients (3 variantes — usar a correta)
- `src/lib/supabase.ts` — **lazy singleton via Proxy** (client criado apenas no primeiro uso, não no import). Usar em server components e `products-db.ts` queries.
- `src/lib/supabase-browser.ts` — singleton `"use client"` (export: `supabaseBrowser`). Usar em client components que precisam de Supabase diretamente.
- `src/lib/supabase-server.ts` — cria client com `cookies()` para ler sessão do usuário. Usar em API routes e server components que precisam do user autenticado (`getUser()`, `createServerSupabase()`).

### Catálogo — dual data source
O catálogo tem duas fontes de dados que coexistem:
- `src/lib/products-db.ts` — queries async ao Supabase (fonte primária, usada pelas pages). `getAllSlugs()` tem fallback para o array estático quando `NEXT_PUBLIC_SUPABASE_URL` não está disponível (build local).
- `src/lib/products.ts` — array estático `PRODUCTS[]` + helpers de formatação (`pixPrice`, `installmentPrice`, `fmt`, `parseWeight`, `parseDimensions`, `imgUrl`, `getProductBySlug`, `getRelated`)

As pages usam `products-db.ts` para dados. Os helpers de formatação e a interface `Product` vivem em `products.ts`. O array estático `PRODUCTS` é legado/fallback — novos produtos vão apenas no Supabase.

**`imgUrl(file)`:** Se `file.startsWith('http')` retorna direto (Supabase Storage), senão prefixa com URL WordPress. Se vazio/placeholder retorna imagem placeholder.

**`PLACEHOLDER`:** constante com URL do placeholder SVG para produtos sem imagem.

### Autenticação
- Login/registro via email+senha (Supabase Auth)
- Sessão gerenciada via cookies httpOnly (`sb-access-token`, `sb-refresh-token`)
- Middleware (`src/middleware.ts`) faz refresh automático de sessão; skip getUser() em paths não-protegidos para performance
- Auth guard: paths `/checkout` e `/minha-conta` redirecionam para `/login?redirect={path}` se não autenticado
- Login form lê `?redirect=` e redireciona após sucesso
- API routes: `/api/auth/login`, `/api/auth/register`, `/api/auth/logout`, `/api/auth/me`, `/api/auth/reset-password`
- Componente `AuthStatus` no header mostra estado de login com dropdown (Minha conta, Meus pedidos, Sair)
- Pages de auth: `src/app/(auth)/login/`, `src/app/(auth)/registro/`, `src/app/(auth)/redefinir-senha/`, `src/app/(auth)/esqueci-senha/`
- **Admin protegido:** `requireAdmin()` helper (`src/lib/require-admin.ts`) verifica cookie + ADMIN_EMAILS em TODAS as API routes admin
- Middleware também bloqueia `/admin` UI para não-admins via ADMIN_EMAILS env var
- **"Confirm email" está DESATIVADO** no Supabase (Sign In/Providers) para evitar rejeição de domínios corporativos brasileiros. SMTP customizado via Resend configurado para evitar rate limits.
- Middleware também bloqueia `/admin` UI para não-admins via ADMIN_EMAILS env var

### Carrinho
- `CartProvider` (`src/contexts/cart-context.tsx`) wraps o app no root layout (é o único provider no layout — não há header/footer compartilhado, cada page inclui `<TopHeader />` individualmente)
- Persistência dual: localStorage (key: `mosca-cart`) + Supabase `cart_items` para usuários logados
- Server sync: on mount, fetches `/api/cart` — merges server + local items; debounced POST sync on changes (1s delay)
- Para anônimos: apenas localStorage
- Drawer lateral abre automaticamente ao adicionar item (`setIsOpen(true)`)
- Badge com contador no header (desktop e mobile)

### Carrinho Abandonado
- Cron job via Vercel: `GET /api/cron/abandoned-cart` — roda 1x/dia às 9h (`vercel.json` — Hobby plan limit)
- Protegido por `CRON_SECRET` (header `Authorization: Bearer {secret}`)
- Detecta carrinhos via coluna `first_added_at` na tabela `cart_items`
- **O sync do carrinho usa UPSERT** (não mais DELETE+INSERT) para preservar `first_added_at` original — coluna essencial para detecção de abandono
- Envia email de recuperação via Resend (`src/lib/email.ts`)
- Admin: `/admin/carrinhos-abandonados` — painel para visualizar e gerenciar

- Tabela `cart_items` tem unique constraint em `(user_id, product_id)` para o upsert funcionar
- Recovery: `POST /api/admin/abandoned-carts/recover` — envia WhatsApp/link de recuperação

### Email (Resend)
- `src/lib/email.ts` — wrapper para Resend API + templates de email
- Graceful fallback: se `RESEND_API_KEY` não configurada, loga warning e retorna false
- Usado pelo cron de carrinho abandonado e confirmação de pedido
=======
- Usado pelo cron de carrinho abandonado + confirmação de pedido
- **SMTP customizado configurado no Supabase** (smtp.resend.com:465, user: resend) para eliminar rate limits e aceitar qualquer domínio de e-mail

### Audit Log
- `src/lib/audit-log.ts` — registra ações admin na tabela `admin_audit_log`
- Non-blocking: erros são engolidos para não quebrar o fluxo principal
- Campos: userId, userEmail, action, entityType, entityId, details, ipAddress

### Analytics (GTM dataLayer)
- `src/lib/analytics.ts` — helpers de rastreamento e-commerce via GTM dataLayer (GA4)
- Funções: `trackAddToCart`, `trackPurchase`, `trackViewItem`, `trackCheckoutStep`
- `src/components/analytics.tsx` — carrega GA4 Script (G-5CRHKEJH7F)
- `src/components/vercel-analytics.tsx` — Vercel Web Analytics (habilitar via dashboard)
- `src/components/product/product-tracker.tsx` — rastreia visualização de produto

### Cookie Consent
- `src/components/cookie-consent.tsx` — banner de consentimento LGPD
- Persiste escolha em localStorage (`mosca-cookie-consent`)

### Melhor Envio (Frete)
- OAuth flow: `/api/shipping/auth` → redirect → `/api/shipping/callback` → token salvo como env var
- Cálculo: `POST /api/shipping/calculate` tenta produção primeiro, fallback para sandbox se 401/403
- Token expira em 30 dias — renovar via OAuth flow
- Debug endpoint: `/api/shipping/debug`
- Logos de transportadoras no frontend (shipping-calculator + shipping-selector): Correios (amarelo/azul), Jadlog (vermelho), Azul (azul escuro), Latam (roxo), fallback (iniciais)

### Checkout (Transparente MercadoPago)
- Página: `src/app/checkout/page.tsx` — server wrapper com `dynamic = "force-dynamic"`, importa `checkout-client.tsx`
- Client: `src/app/checkout/checkout-client.tsx` — client component com 3 steps (endereço → frete → pagamento)
- Step 1 (Endereço): `src/components/checkout/address-form.tsx` — CEP auto-fill via `/api/address/cep` (proxy ViaCEP), campos de endereço + telefone + CPF, salva no perfil
- Step 2 (Frete): `src/components/checkout/shipping-selector.tsx` — reutiliza `/api/shipping/calculate`, agrega itens em pacote
- Step 3 (Pagamento): `src/components/checkout/payment-form.tsx` — tabs Cartão/PIX inline
  - Cartão: SDK JS do MercadoPago tokeniza no client → `POST /api/payments` processa

  - PIX: `POST /api/payments` gera QR code → exibe na página com countdown 15min
- Flow: endereço → frete → `POST /api/checkout` (cria pedido) → mostra payment form → pagamento → redirect `/pedido/{id}`
- `src/lib/mercadopago.ts` — helpers `createCardPayment`, `createPixPayment`, `getPayment` (REST API direta, sem SDK Node)
- **Webhook configurado** no painel MercadoPago (Modo Produção): `https://www.moscabrancaparts.com.br/api/webhooks/mercadopago` com eventos "Pagamentos" e "Alertas de fraude"
=======
  - PIX: `POST /api/payments` gera QR code → exibe na página, polling de confirmação automático
- Flow: endereço → frete → `POST /api/checkout` (cria pedido) → mostra payment form → pagamento → redirect `/pedido/{id}`
- `src/lib/mercadopago.ts` — helpers `createCardPayment`, `createPixPayment`, `getPayment` (REST API direta, sem SDK Node)
- **Webhook configurado** no painel MercadoPago (Modo Produção): `https://www.moscabrancaparts.com.br/api/webhooks/mercadopago` com eventos "Pagamentos" e "Alertas de fraude"

### Página de Produto
- `src/app/produto/[slug]/page.tsx` — ISR server component
- Gallery: `src/components/product/product-gallery.tsx` — galeria de imagens múltiplas (main + extras)
- Reviews: `src/components/product/product-reviews.tsx` — exibe reviews de clientes com estrelas e verified badge
- Coupons: `src/components/product/product-coupons.tsx` — exibe cupons ativos aplicáveis ao produto
- Tracker: `src/components/product/product-tracker.tsx` — dispara `trackViewItem` no GA4


### Busca por Veículo (IA)
- Botão "Buscar com veículo" no header
- Autocomplete via Fipe API + fallback com 50+ veículos brasileiros
- Análise de compatibilidade via Claude Haiku (US$0.0012/busca)
- Cache persistente no Supabase (7 dias TTL, ~70-80% hit rate)
- Analytics de uso e custos
- Componentes: `src/components/vehicle/` (autocomplete, results, search-button, search-dropdown)
- API: `/api/vehicles/search`, `/api/vehicles/compatibility`
- Types: `src/lib/vehicle-types.ts`

### Sistema de Banners
O admin oferece dois modos de criar banners:

**Modo "Imagem Completa":**
- Seleciona produto → escreve instruções livres → botão "Gerar Banner com IA"
- API `/api/admin/banners/generate-image` usa DALL-E 3 com pre-prompt fixo (1440x480px)
- Download e upload automático pro Supabase Storage
- Upload manual opcional: desktop (1440x480px) + mobile (375x200px)

**Modo "Banner HTML":**
- Campos tradicionais (tag, título, subtítulo, CTA, cores)
- Produto selecionado → "Gerar copy com IA" via `/api/admin/banners/generate-copy` (Claude Haiku)
- Preview ao vivo responsivo

**Exibição no site (hero-carousel.tsx):**
- Desktop com `desktop_image_url` → imagem full-width (cover, link clicável no CTA)
- Desktop sem imagem gerada → layout HTML com radial gradient branco
- Mobile → sempre layout HTML responsivo

**Tabela `banners`:** `product_image_url`, `desktop_image_url`, `mobile_image_url`, `bg_color`, `accent_color`, `text_color`

### Multi-imagem de Produtos
- Tabela `product_images` (produto_id, url, sort_order)
- Upload via admin: `src/components/admin/product-images-upload.tsx` — drag & drop múltiplas
- API: `POST/DELETE /api/admin/product-images`
- Exibição: `src/components/product/product-gallery.tsx` na página do produto

### Design System (UI)
- **Estilo**: e-commerce profissional, clean, high-conversion. Dark header com promo bar vermelha, body em #FAFAFA
- **Fontes**: Inter (`--font-inter`) — body/UI | Barlow Condensed (`--font-barlow`) — preços/títulos hero
- **Cores primárias**: red-600 (CTAs, destaques), zinc-950 (header/footer), green (PIX badge/WhatsApp)

- **Product cards**: rounded-2xl, badge desconto % vermelho, preço PIX + tag verde, hover com shadow-lg + add-to-cart overlay
=======
- **Product cards**: rounded-2xl, badge desconto % vermelho, preço PIX + tag verde, hover com shadow-lg + add-to-cart overlay (home carousel)
- **Promo banners**: 4 cards gradiente (PIX, Parcela, Envio, Garantia) com ícones Lucide
- **Homepage sections**: Trust bar branca (icones em circulos red-50) -> Promo banners -> Categories grid (Lucide icons) -> Product carousels -> Testimonials (3 reviews, estrelas) -> Footer
- **Shipping results**: logos de transportadoras (Correios: badge amarelo/azul, Jadlog: vermelho, Azul: azul escuro, Latam: roxo, fallback: iniciais)

- **Responsivo**: mobile drawer com busca, WhatsApp CTA, categorias scrollable

### Controle de Estoque
- Campos: `stock_quantity`, `stock_threshold`, `status`
- Status automático via trigger PostgreSQL: `available` / `low_stock` / `out_of_stock` / `discontinued`
- API: `/api/admin/stock` (GET/PATCH)

### Sistema de Cupons
- Tipos: porcentagem ou valor fixo
- Regras: pedido mínimo, máx usos total, máx usos por usuário, expiração
- `show_on_product` — quando true, exibe cupom na página do produto via `ProductCoupons` component
- Tabelas: `coupons`, `coupon_uses`
- APIs: `/api/admin/coupons` (CRUD), `/api/coupons/validate` (validar no checkout), `/api/coupons/product` (listar por produto)

### Sistema de Reviews
- Tabela `product_reviews` — reviews de clientes (rating 1-5, comment, verified purchase)
- Exibição: `src/components/product/product-reviews.tsx` na página do produto
- Admin moderação: `/admin/avaliacoes`
- APIs: `GET/POST /api/reviews` (público), `GET/POST/PATCH/DELETE /api/admin/reviews` (admin)

### Painel Admin (`/admin`)
- **Layout:** Dark theme (#0a0a0b) com sidebar fixa e accent âmbar

- **Dashboard:** métricas REAIS (receita semanal, trend, gráfico diário, últimos pedidos, estoque baixo)
- **Pedidos:** `/admin/pedidos`
  - Lista com nome do cliente (busca em `profiles.name` → fallback `auth.users.user_metadata.name` → fallback email prefix)
  - Botão **"Ver"** em cada linha abre `OrderDetailModal` (painel lateral) com: cliente (nome/email/telefone/CPF), endereço completo, itens com imagem/preço/link, pagamento e frete detalhados, alteração de status inline
  - API detalhe: `GET /api/admin/orders/[id]`
- **Banners, Produtos, Estoque, Cupons, Carrinhos, Clientes, Avaliações, Categorias, Relatórios, Analytics IA**
=======
- **Dashboard:** `/admin` — métricas REAIS (receita semanal, trend vs semana anterior, gráfico diário, últimos pedidos, estoque baixo). Nenhum dado fake/hardcoded.
- **Banners:** `/admin/banners` — CRUD com preview ao vivo + geração IA (upload de imagem + DALL-E 3)
- **Produtos:** `/admin/produtos` — CRUD, busca, filtros, upload de imagem
- **Imagens:** multi-imagem por produto via product-images-upload
- **Estoque:** `/admin/estoque` — controle visual, botões rápidos, filtros por status
- **Cupons:** `/admin/cupons` — criar/editar, ativar/desativar, cards com stats
- **Carrinhos Abandonados:** `/admin/carrinhos-abandonados` — visualizar e recuperar
- **Pedidos:** `/admin/pedidos` — listar, filtrar, atualizar status
  - Lista com nome do cliente (busca em `profiles.name` → fallback `auth.users.user_metadata.name` → fallback email prefix)
  - Botão **"Ver"** em cada linha abre `OrderDetailModal` (painel lateral) com: cliente (nome/email/telefone/CPF), endereço completo, itens com imagem/preço/link, pagamento e frete detalhados, alteração de status inline
  - API detalhe: `GET /api/admin/orders/[id]`
- **Clientes:** `/admin/clientes` — lista, busca, endereço, contagem pedidos
- **Avaliações:** `/admin/avaliacoes` — moderação de reviews de produtos
- **Categorias:** `/admin/categorias` — gerenciamento de categorias
- **Relatórios:** `/admin/relatorios` — relatórios do negócio
- **Analytics IA:** `/admin/analytics` — custos, tokens, cache hits (tabela: `ai_usage_analytics`)

- **Segurança:** `requireAdmin()` em todas as APIs — se retornar 403, a página exibe erro vermelho em vez de tabela vazia (facilita diagnóstico)
- **AdminTableRow** aceita prop `className` opcional

### Upload de Imagens
- Supabase Storage bucket: `product-images`

- Drag & drop ou clique para upload (JPG, PNG, WebP, GIF — máx 5MB)
- API: `/api/admin/upload` (POST/DELETE)
- Componente: `src/components/admin/image-upload.tsx`

### Pedidos e Conta do Usuário
- Confirmação: `src/app/pedido/[id]/page.tsx` — server component, mostra status do pagamento
- Área do usuário: `src/app/minha-conta/` com layout + sidebar (perfil, pedidos, senha)
- Webhook MercadoPago: `POST /api/webhooks/mercadopago`
=======
- Drag & drop ou clique para upload (single e multi-imagem)
- Validação: JPG, PNG, WebP, GIF (máx 5MB)
- Preview em tempo real
- API: `/api/admin/upload` (POST/DELETE), `/api/admin/product-images` (POST/DELETE multi)
- Componentes: `src/components/admin/image-upload.tsx`, `src/components/admin/product-images-upload.tsx`

### Pedidos e Conta do Usuário
- Confirmação: `src/app/pedido/[id]/page.tsx` — server component, mostra status do pagamento
- Status tracking: `PATCH /api/orders/[id]/status` — atualiza status do pedido
- Área do usuário: `src/app/minha-conta/` com layout + sidebar
  - Perfil: `src/app/minha-conta/page.tsx` — edita nome, telefone, endereço (via `PATCH /api/profile`)
  - Pedidos: `src/app/minha-conta/pedidos/page.tsx` — lista pedidos
  - Detalhe: `src/app/minha-conta/pedidos/[id]/page.tsx` — pedido completo
  - Alterar Senha: `src/app/minha-conta/senha/page.tsx` — troca senha via Supabase Auth
- Webhook: `POST /api/webhooks/mercadopago` — recebe IPN, atualiza status do pedido via service role key

  - Valida assinatura HMAC-SHA256 via `MERCADOPAGO_WEBHOOK_SECRET`
  - Chama `getPayment(id)` para buscar status real — **ID fake em simulações é tratado graciosamente (retorna 200)**
  - Atualiza `orders.status`: `approved → confirmed`, `rejected/cancelled → cancelled`
  - Envia email de confirmação/rejeição via Resend

### Componentes UI
- `src/components/automotive/` — header, hero-carousel, product section, promo banners, add-to-cart
- `src/components/cart/` — drawer, button, item, summary

- `src/components/auth/` — login-form, register-form, auth-status
- `src/components/checkout/` — address-form, checkout-steps, shipping-selector, order-summary, payment-form
- `src/components/vehicle/` — autocomplete, results, search-button, search-dropdown
- `src/components/admin/` — admin-sidebar, image-upload, **order-detail-modal** (novo)
- `src/components/footer.tsx`, `src/components/product-image.tsx`, `src/components/shipping-calculator.tsx`
=======
- `src/components/auth/` — login-form, register-form, auth-status (dropdown com Minha conta, Pedidos, Sair), user-menu
- `src/components/checkout/` — address-form, checkout-steps, shipping-selector, order-summary, payment-form, checkout-header
- `src/components/vehicle/` — autocomplete, results, search-button, search-dropdown
- `src/components/admin/` — admin-sidebar, admin-ui, admin-layout-client, image-upload, product-images-upload
- `src/components/product/` — product-gallery, product-reviews, product-coupons, product-tracker
- `src/components/analytics/` — ai-dashboard
- `src/components/cep/` — cep-modal (modal de CEP no header)
- `src/components/footer.tsx` — footer global reutilizável (institucional, conta, contato, WhatsApp)
- `src/components/preloader.tsx` — preloader remover (fly animation)
- `src/components/cookie-consent.tsx` — cookie consent banner (LGPD)
- `src/components/analytics.tsx` — GA4 script loader
- `src/components/vercel-analytics.tsx` — Vercel Web Analytics
- `src/components/product-image.tsx` — product image component com fallback placeholder
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

### Tipografia

- **Inter** (`font-inter`, `--font-inter`) — body, labels, UI
- **Barlow Condensed** (`font-barlow`, `--font-barlow`) — preços, títulos hero
=======

- **Ubuntu** (`--font-ubuntu`) — fonte principal (300/400/500/700), carregada via `next/font/google`


### Princípios visuais
- Bordas sutis (zinc-100), sombras leves (shadow-sm/md)
- Hover: escurecimento de borda + shadow-md
- Cantos: rounded-xl em cards, rounded-lg em inputs/botões
- Transições: 200-300ms, ease-out — Touch targets: min 44x44px
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
MERCADOPAGO_WEBHOOK_SECRET=...    # validação de assinatura HMAC no webhook


# IA
VERCEL_AI_GATEWAY_URL=...
ANTHROPIC_API_KEY=...
OPENAI_API_KEY=...                # para geração de banners com DALL-E 3
=======
# IA (Claude via Vercel AI Gateway)
VERCEL_AI_GATEWAY_URL=...         # Gateway URL para chamadas IA
ANTHROPIC_API_KEY=...             # API key Anthropic

# OpenAI (DALL-E 3 — geracao de banners)
OPENAI_API_KEY=...                # API key OpenAI para geracao de banners


# Email (Resend)
RESEND_API_KEY=...
EMAIL_FROM=Mosca Branca Parts <noreply@moscabrancaparts.com.br>

# Cron
CRON_SECRET=...                   # header Authorization: Bearer {secret}

# App
NEXT_PUBLIC_APP_URL=https://www.moscabrancaparts.com.br

ADMIN_EMAILS=email1@example.com,email2@example.com
=======
ADMIN_EMAILS=email1@example.com,email2@example.com   # emails autorizados no admin (comma-separated)

# Analytics
NEXT_PUBLIC_GOOGLE_VERIFICATION=...  # Google Search Console verification
NEXT_PUBLIC_GA4_ID=G-5CRHKEJH7F      # GA4 Measurement ID

```

## API Routes

### Públicas
- `GET /api/vehicles/search?q=` — busca veículos (Fipe + fallback)
- `POST /api/vehicles/compatibility` — análise IA de compatibilidade (`export const dynamic = 'force-dynamic'`)
- `POST /api/shipping/calculate` — cálculo de frete
- `GET /api/address/cep?cep=` — consulta CEP (ViaCEP)
- `POST /api/payments` — processar pagamento (PIX ou cartão)
- `POST /api/checkout` — criar pedido

- `POST /api/webhooks/mercadopago` — IPN webhook (sem auth — middleware exclui esse path)
- `GET/POST/DELETE /api/cart` — sync carrinho (usuários logados)
- `GET /api/categories` — categorias públicas (`export const dynamic = 'force-dynamic'`)
- `GET /api/cron/abandoned-cart` — cron job (protegido por CRON_SECRET)
=======
- `POST /api/webhooks/mercadopago` — IPN webhook
- `GET/POST /api/cart` — sync carrinho (usuários logados)
- `GET/POST /api/profile` — dados do perfil do usuário
- `GET/POST /api/reviews` — reviews públicas de produtos
- `GET /api/coupons/validate?code=&total=` — validar cupom no checkout
- `GET /api/coupons/product?id=` — cupons aplicáveis a um produto
- `PATCH /api/orders/[id]/status` — atualizar status do pedido
- `GET /api/categories` — listar categorias públicas
- `GET /api/cron/abandoned-cart` — cron job notificação carrinho abandonado (protegido por CRON_SECRET)


### Admin
- `GET /api/admin/dashboard` — métricas gerais
- `GET/POST/PATCH/DELETE /api/admin/products` — CRUD produtos
- `GET/PATCH /api/admin/stock` — controle estoque
- `GET/POST/PATCH/DELETE /api/admin/banners` — CRUD banners + geração IA
- `GET/POST/PATCH/DELETE /api/admin/coupons` — CRUD cupons
- `GET/PATCH /api/admin/orders` — lista pedidos (enriquecido com nome do cliente)
- `GET /api/admin/orders/[id]` — detalhe completo do pedido (itens, cliente, endereço, pagamento)
- `GET /api/admin/customers` — clientes
- `POST/DELETE /api/admin/upload` — upload imagens (single)
- `POST/DELETE /api/admin/product-images` — upload imagens (multi por produto)
- `GET /api/analytics/ai-usage` — analytics IA

=======
- `GET/POST/PATCH/DELETE /api/categories` — CRUD categorias
- `GET/POST/PATCH/DELETE /api/admin/reviews` — moderação reviews
- `GET /api/admin/abandoned-carts` — listar carrinhos abandonados
- `POST /api/admin/abandoned-carts/recover` — recuperar carrinho abandonado
- `GET /api/admin/reports` — relatórios do negócio


## Bugs Conhecidos / TODO

- [x] ~~`/loja` não existe como rota~~ — criada e funcional
- [x] ~~Menu de categorias não é clicável~~ — dropdown funcional
- [x] ~~"Informe CEP" não funciona~~ — CepModal funcional
- [x] ~~Admin sem autenticação~~ — `requireAdmin()` em todas as APIs
- [x] ~~Admin mostra tabela vazia sem erro~~ — exibe mensagem de erro real (incluindo 403/500)
- [x] ~~Pedidos sem nome do cliente~~ — busca via profiles + auth.users metadata
- [x] ~~Sem detalhe de pedido no admin~~ — OrderDetailModal com itens, cliente, endereço, pagamento
- [x] ~~Carrinho abandonado nunca detectava nada~~ — cart sync usa UPSERT preservando `first_added_at`
- [x] ~~Webhook MercadoPago retornava 500 em simulações~~ — trata ID fake graciosamente
- [x] ~~Webhook retornava 307 (redirect)~~ — URL configurada com `www.` no painel do MP
- [x] ~~Email "invalid" ao registrar domínios corporativos~~ — Confirm email desativado + SMTP Resend
- [x] ~~Mensagens de erro do Supabase Auth em inglês~~ — traduzidas para português no register
- [x] ~~Imagens de produtos apontam para URL WordPress~~ — `imgUrl()` trata URLs completas
- [x] ~~Banner com peças escuras somem no fundo~~ — spotlight radial gradient + `desktop_image_url`
- [x] ~~Trigger `handle_new_user` não salvava nome~~ — corrigido para salvar de `raw_user_meta_data`
- [ ] Redes sociais no footer apontam para `#` (faltam URLs reais)
- [ ] Páginas `/politica-de-privacidade` e `/termos-de-uso` precisam de conteúdo real
- [ ] Melhor Envio token expira em 30 dias — renovação manual necessária
- [ ] Reviews de produto: formulário público não existe (só admin modera)
- [ ] Busca por veículo: componente existe mas não integrado ao header

=======
- [ ] Página `/politica-de-privacidade` e `/termos-de-uso` precisam de conteúdo real
- [ ] Melhor Envio token expira em 30 dias — automatizar renovação
- [ ] Reviews de produto: formulário público de avaliação não existe ainda (só admin modera)
- [ ] Busca por veículo: ainda não integrada ao header (componente existe mas não aparece)


## Gotchas

### TypeScript / Build
- **NUNCA usar `[...new Set()]`** — usar `Array.from(new Set(...))`. O tsconfig tem `target: "es5"` que não suporta iteração de Set com spread.
- **NUNCA instanciar Supabase no top-level de API routes** — usar padrão lazy `function getSupabase() { return createClient(...) }`. API routes que importam `products-db.ts` (que usa o singleton) devem ter `export const dynamic = 'force-dynamic'`.
- `supabase.ts` usa Proxy para lazy singleton — o client só é criado no primeiro uso, não no import.
- `getAllSlugs()` em `products-db.ts` tem fallback para array estático quando `NEXT_PUBLIC_SUPABASE_URL` não está disponível (build local sem `.env.local`).
- Pages com `useSearchParams()` precisam de `<Suspense>` boundary.

=======

### Vercel build & env vars
- **NUNCA** instanciar Supabase client no top-level de API routes — o Next.js avalia esses módulos em build time e as env vars podem não existir. Usar padrão lazy: `function getSupabase() { return createClient(...) }` e chamar dentro do handler.
- `NEXT_PUBLIC_*` vars são inlined pelo bundler em server components/pages (funcionam no top-level de `src/lib/supabase.ts`), mas **não** em API routes durante "page data collection".
- Todas as env vars devem estar configuradas no Vercel dashboard (Settings → Environment Variables) para Production e Preview.
- Pages que usam `useSearchParams()` precisam de `<Suspense>` boundary para evitar prerender errors.
- Pages protegidas por auth que são `"use client"` precisam de wrapper server component com `export const dynamic = "force-dynamic"`.


### Profiles table
- Schema: `id`, `name`, `phone`, `address_json`, `created_at` — **NÃO TEM** `email`, `full_name`, `updated_at`
- `name` pode ser NULL — trigger anterior não salvava o nome. Para buscar nome do cliente, sempre checar:
  1. `profiles.name`
  2. `auth.users.user_metadata.name`
  3. `auth.users.user_metadata.full_name`
  4. Prefixo do email como último recurso


### Admin — erros silenciosos
- Se `requireAdmin()` retorna 403, a API retorna erro JSON. A UI exibe banner vermelho com o erro real.
- Se ADMIN_EMAILS não contém o email do usuário logado → 403 em todas as rotas admin.
- Verificar: Vercel → Settings → Environment Variables → `ADMIN_EMAILS`
=======
### Dados e APIs
- `products.ts` has `parseWeight(str)` and `parseDimensions(str)` helpers that convert human-readable strings ("0,5 kg", "30x20x15 cm") to numeric values for the shipping API. Defaults when missing: weight=0.3kg, dimensions=16x10x10cm
- Supabase columns use `snake_case`, TypeScript interfaces use `camelCase` — the `rowToProduct()` mapper in `products-db.ts` handles conversion
- MercadoPago integration uses direct REST API calls (`src/lib/mercadopago.ts`), not the official Node SDK
- The middleware matcher excludes `/api/shipping`, `/api/webhooks`, and `/api/cron` — these must remain unauthenticated for external callbacks


### Admin — erros silenciosos
- Se `requireAdmin()` retorna 403, a API retorna erro JSON. A UI exibe banner vermelho com o erro real.
- Se ADMIN_EMAILS não contém o email do usuário logado → 403 em todas as rotas admin.
- Verificar: Vercel → Settings → Environment Variables → `ADMIN_EMAILS`

### Carrinho
- Cart state: localStorage + Supabase `cart_items` (dual persistence)
- Sync usa UPSERT com `onConflict: 'user_id,product_id'` — **preserva `first_added_at`**
- Usuários anônimos: apenas localStorage
- O `CartDrawer` está dentro do `TopHeader` — páginas sem TopHeader não têm carrinho


### MercadoPago Webhook
- URL configurada no painel MP (Modo Produção): `https://www.moscabrancaparts.com.br/api/webhooks/mercadopago`
- Eventos marcados: Pagamentos + Alertas de fraude
- ID fake em simulações (`123456`) → `getPayment()` falha → retorna 200 OK graciosamente
- Pedido permanece `pending` até webhook confirmar (`approved → confirmed`)
- Pagamento via PIX aparece como `bank_transfer` no campo `payment_method`
=======
- Badge do carrinho usa `loaded` do CartContext para evitar hydration mismatch


### MercadoPago Webhook
- URL configurada no painel MP (Modo Produção): `https://www.moscabrancaparts.com.br/api/webhooks/mercadopago`
- Eventos marcados: Pagamentos + Alertas de fraude
- ID fake em simulações (`123456`) → `getPayment()` falha → retorna 200 OK graciosamente
- Pedido permanece `pending` até webhook confirmar (`approved → confirmed`)
- Pagamento via PIX aparece como `bank_transfer` no campo `payment_method`

### RLS Supabase
- `order_items` precisa de policy INSERT além de SELECT para o checkout funcionar
- Banners/Coupons: policy pública SELECT (is_active = true), service_role para ALL

### Imagens de Produtos
- Supabase Storage: URL completa → usar direto
- WordPress legado: prefixado com `https://www.moscabrancaparts.com.br/wp-content/uploads/2026/04/`
- `imgUrl()` detecta automaticamente via `file.startsWith('http')`
- `next.config.js` remotePatterns: `moscabrancaparts.com.br` e `mcaxtwztzfrytxtkgdxh.supabase.co`

=======

### Rate Limiting
- `src/lib/rate-limit.ts` — rate limiter in-memory com lazy cleanup (sem setInterval/timer leak)
- Cleanup ativa apenas quando store > 100 entries e a cada 60s
- Usado em APIs sensíveis (login, registro, reviews)

### SEO
- Root layout: metadata completo com `title.template`, Open Graph, Twitter Cards, robots
- Produto: metadata dinâmico com OG image, preço na description
- Home: Schema.org Organization + WebSite com SearchAction
- Sitemap: `src/app/sitemap.ts` — gera URLs de páginas estáticas + todos os produtos dinâmicos
- `robots.ts`: permite indexação completa
- Google Search Console verification via `NEXT_PUBLIC_GOOGLE_VERIFICATION`


### Proxy/Network (Desenvolvimento)
- Claude Code configura proxy HTTP (localhost:53280) que bloqueia `git push`
- Solução: terminal separado → `unset HTTP_PROXY HTTPS_PROXY http_proxy https_proxy` → `git push origin main`
- Deploy automático na Vercel ao push para main

## Convenções

- Componentes client: `"use client"` no topo
- Páginas com dados do Supabase: async + `revalidate = 60`
- Imports com `@/` alias (mapeia para `src/`)
- `cn()` helper (clsx + tailwind-merge) em `src/lib/utils.ts`
- Commits: inglês, prefixo convencional (`feat:`, `fix:`, `style:`, `docs:`)
- **Nunca push sem `npm run build` passar localmente** (ou verificar que não há erros TypeScript)
- Container max-width: 1280px, centrado, padding responsivo
- Admin: dark theme, accent amber, sidebar fixa

## Checklist pré-deploy

- [ ] `npm run build` passa sem erros TypeScript
- [ ] `Array.from(new Set(...))` — nunca spread em Set
- [ ] Supabase client lazy em API routes (`function getSupabase()`)
- [ ] `cursor-pointer` em elementos clicáveis
- [ ] Hover com transição suave (150-300ms)
- [ ] Responsivo: 375px, 768px, 1024px, 1440px
- [ ] APIs com try/catch e fallback graceful
- [ ] Imagens com fallback se URL quebrada

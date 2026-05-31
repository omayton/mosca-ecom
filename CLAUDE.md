# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Projeto

E-commerce de peças automotivas raras (Mosca Branca Parts). Single-store com catálogo no Supabase, autenticação, carrinho persistente e cálculo de frete via Melhor Envio.

- **URL produção:** https://mosca-ecom.vercel.app
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
- `src/lib/supabase-browser.ts` — singleton `"use client"`. Usar em client components que precisam de Supabase diretamente.
- `src/lib/supabase-server.ts` — cria client com `cookies()` para ler sessão do usuário. Usar em API routes e server components que precisam do user autenticado (`getUser()`, `createServerSupabase()`).

### Catálogo — dual data source
O catálogo tem duas fontes de dados que coexistem:
- `src/lib/products-db.ts` — queries async ao Supabase (fonte primária, usada pelas pages)
- `src/lib/products.ts` — array estático `PRODUCTS[]` + helpers de formatação (`pixPrice`, `installmentPrice`, `fmt`, `parseWeight`, `parseDimensions`, `imgUrl`, `getProductBySlug`, `getRelated`)

As pages usam `products-db.ts` para dados. Os helpers de formatação e a interface `Product` vivem em `products.ts`. O array estático `PRODUCTS` é legado/fallback — novos produtos vão apenas no Supabase.

### Autenticação
- Login/registro via email+senha (Supabase Auth)
- Sessão gerenciada via cookies httpOnly (`sb-access-token`, `sb-refresh-token`)
- Middleware (`src/middleware.ts`) faz refresh automático de sessão; exclui `/api/shipping` do matcher
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

### Componentes UI
- `src/components/automotive/` — componentes de página (header, hero, product section, promo banners, add-to-cart)
- `src/components/cart/` — drawer, button, item, summary
- `src/components/auth/` — login-form, register-form, auth-status, user-menu
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
```

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

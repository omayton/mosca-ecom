# CLAUDE.md — Mosca Branca Parts E-commerce

## Projeto

E-commerce de peças automotivas raras. Loja single-store (não multi-tenant) com catálogo estático e cálculo de frete via Melhor Envio.

**URL produção:** https://mosca-ecom.vercel.app
**Stack:** Next.js 14 (App Router) + Tailwind CSS + TypeScript
**Deploy:** Vercel (auto-deploy via push no branch `main`)

## Comandos

```bash
npm run dev      # Dev server localhost:3000
npm run build    # Build de produção
npm run lint     # ESLint
```

## Estrutura

```
src/
├── app/
│   ├── layout.tsx                    # Root layout (Inter + Barlow Condensed)
│   ├── page.tsx                      # Home page
│   ├── globals.css                   # Tailwind + base styles
│   ├── produto/[slug]/page.tsx       # Página de produto (SSG)
│   └── api/shipping/
│       ├── calculate/route.ts        # POST — cálculo de frete (Melhor Envio)
│       ├── auth/route.ts             # GET — OAuth redirect para Melhor Envio
│       ├── callback/route.ts         # GET — OAuth callback (gera tokens)
│       └── debug/route.ts            # GET — debug endpoint (remover em prod)
├── components/
│   ├── automotive/
│   │   ├── top-header.tsx            # Header sticky 3 camadas
│   │   ├── hero-carousel.tsx         # Hero com 3 slides + gear SVG
│   │   ├── product-section.tsx       # Carousels de produtos (Featured + Recent)
│   │   ├── promo-banners.tsx         # Banners PIX e parcelamento
│   │   └── add-to-cart.tsx           # Botão adicionar ao carrinho
│   ├── shipping-calculator.tsx       # Calculadora de frete (client component)
│   └── ui/                           # Primitivos (button, card)
├── lib/
│   ├── products.ts                   # Catálogo, helpers de preço, parseWeight/parseDimensions
│   └── utils.ts                      # cn() helper (clsx + tailwind-merge)
```

## Design System

**Skill:** UI/UX Pro Max (`.claude/skills/ui-ux-pro-max/`)
**Master file:** `design-system/mosca-branca-parts/MASTER.md`

### Paleta

| Papel | Valor | Tailwind |
|-------|-------|----------|
| Background | #FAFAFA | bg-[#FAFAFA] |
| Text | #18181B | text-zinc-900 |
| CTA/Accent | #DC2626 | bg-red-600 |
| PIX/Success | #16A34A | text-green-600 |
| Borders (repouso) | zinc-100 | border-zinc-100 |
| Borders (hover) | zinc-200 | border-zinc-200 |

### Tipografia

- **Inter** (`font-inter`) — body, labels, UI
- **Barlow Condensed** (`font-barlow`) — preços, títulos hero, impacto

### Princípios visuais

- Minimalista + identidade automotiva
- Bordas sutis (zinc-100), sombras leves (shadow-sm/md)
- Badges tintados: `bg-red-50 text-red-700` (não fundo sólido)
- Hover: escurecimento de borda + shadow-md (sem translate-y)
- Cantos: rounded-xl em cards, rounded-lg em inputs/botões
- Transições: 200-300ms, ease-out
- Touch targets: min 44x44px
- Ícones: Lucide React (nunca emojis como ícones)
- `cursor-pointer` em todo elemento clicável
- `prefers-reduced-motion` respeitado

## Melhor Envio (Frete)

### Fluxo OAuth

1. Usuário acessa `/api/shipping/auth` → redirect para Melhor Envio
2. Autoriza → callback em `/api/shipping/callback`
3. Callback troca code por `access_token` + `refresh_token`
4. Token é copiado para env var `MELHOR_ENVIO_TOKEN` na Vercel

### API de cálculo

- **Endpoint:** `POST /api/shipping/calculate`
- **Body:** `{ cep, weight, width, height, length, price }`
- **URL primária:** `https://melhorenvio.com.br/api/v2/me/shipment/calculate` (produção)
- **Fallback:** sandbox (se 401/403 na produção)
- **Token expira em 30 dias** — renovar via `/api/shipping/auth`

### Variáveis de ambiente (Vercel)

```
MELHOR_ENVIO_CLIENT_ID=25510
MELHOR_ENVIO_CLIENT_SECRET=***
MELHOR_ENVIO_TOKEN=eyJ...  (access_token JWT, 30 dias)
MELHOR_ENVIO_REFRESH_TOKEN=***
MELHOR_ENVIO_CEP_ORIGEM=38190000
```

## Catálogo

Produtos definidos em `src/lib/products.ts` como array estático (`PRODUCTS`). Cada produto tem: id, slug, name, price, oldPrice?, category, categorySlug, imageFile, description, weight, dimensions, inStock, featured.

**Imagens:** hospedadas em `https://www.moscabrancaparts.com.br/wp-content/uploads/2026/04/`

**Helpers:**
- `parseWeight("0,1 kg")` → `0.1`
- `parseDimensions("18×15×18 cm")` → `{ width: 18, height: 15, length: 18 }`
- `pixPrice(price)` → preço com 5% desconto
- `installmentPrice(price, n)` → parcela sem juros
- `fmt(number)` → formatação pt-BR

## Convenções

- Componentes client: `"use client"` no topo
- Páginas SSG: `generateStaticParams()` para rotas dinâmicas
- Imports com `@/` alias (src/)
- Commits em inglês, prefixo convencional: `feat:`, `fix:`, `style:`, `docs:`
- Nunca push direto em main sem testar build
- Não commitar `.env.local` (contém secrets)

## Checklist pré-entrega

- [ ] Sem emojis como ícones (usar Lucide SVG)
- [ ] `cursor-pointer` em elementos clicáveis
- [ ] Hover com transição suave (150-300ms)
- [ ] Contraste texto 4.5:1 mínimo
- [ ] Focus states visíveis
- [ ] Responsivo: 375px, 768px, 1024px, 1440px
- [ ] Sem scroll horizontal no mobile
- [ ] Build passa sem erros (`npm run build`)

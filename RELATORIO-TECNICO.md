# Relatório Técnico — Mosca Branca Parts
## Gap Analysis & Roadmap de Implementação

Data: 2026-06-01 | Stack: Next.js 14.2 + Supabase + Vercel

---

## LEGENDA DE STATUS

- ✅ Implementado
- ⚠️ Parcial (existe mas incompleto)
- ❌ Não existe

---

## 1. ESTRUTURA DE PÁGINAS

| Página | Status | Observação |
|--------|--------|------------|
| Home | ✅ | Server component, ISR 60s |
| Categoria/Loja | ✅ | Recém-criada com filtros dinâmicos |
| Produto | ✅ | ISR, SEO metadata, shipping calc |
| Carrinho | ✅ | Drawer lateral, localStorage |
| Checkout | ✅ | 3 steps (endereço → frete → pagamento) |
| Pagamento | ✅ | Integrado no checkout (Pix + Cartão) |
| Pedido confirmado | ✅ | `/pedido/[id]` |
| Área do cliente | ✅ | `/minha-conta` com perfil e pedidos |
| Login/Cadastro | ✅ | Email + senha via Supabase Auth |
| Recuperação de senha | ❌ | Não existe |
| Histórico de pedidos | ✅ | `/minha-conta/pedidos` |
| Rastreamento | ❌ | Não existe |
| Políticas (troca, privacidade, termos, LGPD) | ❌ | Nenhuma página institucional |
| FAQ | ❌ | Não existe |
| Contato | ❌ | Só WhatsApp no footer |
| Institucional/Sobre | ❌ | Não existe |
| Página 404 | ❌ | Não existe (usa default Next.js) |
| Error boundary | ❌ | Nenhum `error.tsx` |
| Loading states | ❌ | Nenhum `loading.tsx` |

### PRIORIDADE ALTA — Implementar:
1. Recuperação de senha
2. Páginas institucionais (privacidade, termos, LGPD — obrigatório legal)
3. Página 404 customizada
4. Error boundaries (`error.tsx` no root e admin)
5. Rastreamento de pedidos

---

## 2. CADASTRO DE PRODUTOS

| Item | Status | Observação |
|------|--------|------------|
| Título | ✅ | Campo `name` |
| Descrição | ✅ | Campo `description` |
| Fotos | ⚠️ | Uma foto por produto, sem galeria |
| Variações (cor, tamanho) | ❌ | Não existe |
| SKU | ❌ | Não existe |
| Estoque | ✅ | `stock_quantity` + trigger automático |
| Peso/Dimensões | ✅ | Campos texto com parser |
| Preço | ✅ | `price` |
| Preço promocional | ✅ | `old_price` |
| Categorias | ✅ | CRUD dinâmico recém-criado |
| Tags | ❌ | Não existe |
| SEO por produto | ⚠️ | Só title/description, sem Schema.org |
| Produtos relacionados | ✅ | Automático por categoria |
| Cross-sell/Upsell | ❌ | Não existe |
| Ativo/Inativo | ✅ | Campo `status` |

### PRIORIDADE ALTA:
1. Galeria de imagens (múltiplas fotos por produto)
2. SKU para controle de estoque profissional
3. Schema.org Product (JSON-LD) para SEO

### PRIORIDADE MÉDIA:
4. Variações de produto
5. Tags para busca e filtros
6. Cross-sell no checkout

---

## 3. CARRINHO E CHECKOUT

| Item | Status | Observação |
|------|--------|------------|
| Cálculo de frete | ✅ | Melhor Envio |
| Cupom de desconto | ✅ | Sistema completo |
| Validação de endereço | ✅ | ViaCEP auto-fill |
| Resumo do pedido | ✅ | No checkout |
| Pix | ✅ | QR code inline |
| Cartão | ✅ | Tokenização MercadoPago |
| Boleto | ❌ | Não implementado |
| Recuperação de carrinho abandonado | ❌ | Não existe |
| Proteção contra pedidos duplicados | ⚠️ | Checa `status !== "pending"` mas sem idempotency key |
| Logs de tentativa de pagamento | ❌ | Só console.error |
| Mensagens claras de erro | ⚠️ | Básico |

### PRIORIDADE ALTA:
1. Idempotency key no checkout (evitar cobranças duplicadas)
2. Logs de pagamento persistentes (tabela `payment_logs`)
3. Recuperação de carrinho abandonado (email/WhatsApp)

### PRIORIDADE MÉDIA:
4. Boleto como método de pagamento
5. Mensagens de erro mais descritivas no checkout

---

## 4. SEGURANÇA

| Item | Status | Observação |
|------|--------|------------|
| SSL | ✅ | Vercel HTTPS automático |
| SQL Injection | ✅ | Supabase client usa queries parametrizadas |
| XSS | ⚠️ | React escapa por padrão, mas sem CSP header |
| CSRF | ⚠️ | Cookies httpOnly + SameSite=lax, mas sem token CSRF |
| Rate limit | ❌ | Nenhum rate limit em login/checkout/API |
| Senhas criptografadas | ✅ | Supabase Auth (bcrypt) |
| 2FA para admin | ❌ | Não existe |
| Permissões por nível | ⚠️ | Só email allowlist, sem roles |
| Proteção do admin | ✅ | Middleware com email check (recém-implementado) |
| Logs de acesso | ❌ | Não existe |
| Logs de alterações | ❌ | Não existe |
| Backup automático | ⚠️ | Supabase faz backup diário (plano Pro) |
| WAF/Firewall | ⚠️ | Vercel tem proteção DDoS básica |
| Bloqueio de IP | ❌ | Não implementado |
| Sanitização de inputs | ⚠️ | Parcial — sem validação robusta nas APIs |
| Upload malicioso | ⚠️ | Valida extensão mas não conteúdo |
| Headers de segurança | ❌ | Nenhum (CSP, X-Frame, HSTS custom) |
| Sessão segura | ✅ | httpOnly, Secure, SameSite |
| Expiração de sessão | ✅ | Token expira, refresh automático |
| Brute force | ❌ | Sem proteção |
| Webhook signature validation | ❌ | MercadoPago webhook não valida assinatura |

### PRIORIDADE CRÍTICA:
1. Rate limiting (login, registro, checkout, APIs públicas)
2. Validação de assinatura do webhook MercadoPago
3. Security headers (CSP, X-Frame-Options, X-Content-Type-Options, HSTS)
4. Input validation/sanitização robusta (zod em todas as APIs)

### PRIORIDADE ALTA:
5. Audit log (tabela `admin_audit_log` para ações críticas)
6. 2FA para administradores
7. Proteção contra brute force (lockout após N tentativas)
8. Validação de conteúdo no upload (magic bytes, não só extensão)

---

## 5. PAGAMENTOS E PCI

| Item | Status | Observação |
|------|--------|------------|
| Não armazenar dados de cartão | ✅ | Tokenização via SDK MercadoPago |
| Gateway confiável | ✅ | MercadoPago |
| Tokenização | ✅ | Client-side via SDK JS |
| Webhooks | ✅ | `/api/webhooks/mercadopago` |
| Validação de assinatura webhook | ❌ | NÃO VALIDA — risco crítico |
| Logs sem dados sensíveis | ⚠️ | Logs mínimos, sem tabela dedicada |
| Tratamento de falhas | ⚠️ | Básico |
| Conciliação de pagamentos | ❌ | Não existe |
| Status correto do pedido | ✅ | Webhook atualiza status |
| Antifraude | ⚠️ | MercadoPago tem antifraude nativo |
| Regras de aprovação manual | ❌ | Não existe |

### PRIORIDADE CRÍTICA:
1. Validar assinatura HMAC do webhook MercadoPago
2. Tabela `payment_logs` com histórico de tentativas

### PRIORIDADE ALTA:
3. Conciliação automática (cron job verifica pagamentos pendentes)
4. Retry em caso de falha no webhook

---

## 6. LGPD E PRIVACIDADE

| Item | Status |
|------|--------|
| Política de privacidade | ❌ |
| Consentimento de cookies | ❌ |
| Termos de uso | ❌ |
| Exclusão de conta/dados | ❌ |
| Exportação de dados | ❌ |
| Registro de consentimento | ❌ |
| Minimização de coleta | ⚠️ |

### PRIORIDADE CRÍTICA (obrigação legal):
1. Página de Política de Privacidade
2. Banner de consentimento de cookies
3. Termos de uso
4. Mecanismo de exclusão de conta (LGPD Art. 18)

---

## 7. INTEGRAÇÕES

| Item | Status | Observação |
|------|--------|------------|
| Gateway pagamento | ✅ | MercadoPago |
| Transportadoras | ✅ | Melhor Envio |
| ERP | ❌ | |
| Nota fiscal | ❌ | |
| Marketplace | ❌ | |
| WhatsApp | ⚠️ | Só link wa.me, sem API |
| Email marketing | ❌ | |
| CRM | ❌ | |
| Pixel Meta | ❌ | |
| Google Analytics 4 | ❌ | |
| Google Tag Manager | ❌ | |
| Google Merchant Center | ❌ | |
| API de rastreio | ❌ | |
| Retentativas automáticas | ❌ | |

### PRIORIDADE ALTA:
1. Google Analytics 4 + GTM (tracking de conversão)
2. Pixel Meta (se fizer tráfego pago)
3. Email transacional (pedido confirmado, enviado, etc.)
4. Nota fiscal eletrônica (obrigatório para venda)

### PRIORIDADE MÉDIA:
5. WhatsApp Business API (notificações automáticas)
6. Google Merchant Center (Shopping ads)
7. Rastreio automático via Melhor Envio

---

## 8. ADMINISTRAÇÃO

| Item | Status |
|------|--------|
| Painel de pedidos | ✅ |
| Painel de produtos | ✅ |
| Painel de clientes | ✅ |
| Controle de estoque | ✅ |
| Status de pedido | ✅ |
| Nota fiscal | ❌ |
| Gestão de cupons | ✅ |
| Gestão de banners | ✅ |
| Gestão de categorias | ✅ |
| Gestão de avaliações | ❌ |
| Relatórios de venda | ❌ |
| Relatórios de abandono | ❌ |
| Relatórios financeiros | ❌ |
| Permissões para equipe | ❌ |
| Histórico de ações | ❌ |

### PRIORIDADE ALTA:
1. Relatórios de vendas (por período, produto, categoria)
2. Histórico de ações administrativas (audit log)
3. Sistema de avaliações de produtos

---

## 9. PERFORMANCE

| Item | Status | Observação |
|------|--------|------------|
| Imagens otimizadas | ⚠️ | next/image mas sem WebP forçado |
| Lazy loading | ✅ | next/image default |
| CDN | ✅ | Vercel Edge Network |
| Cache | ✅ | ISR revalidate=60 |
| Minificação | ✅ | Next.js automático |
| Banco otimizado | ⚠️ | Sem índices customizados documentados |
| Paginação | ⚠️ | Admin tem, loja não |
| Busca rápida | ⚠️ | ilike básico, sem full-text search |
| Core Web Vitals | ⚠️ | Não medido/otimizado |
| Performance mobile | ⚠️ | Responsivo mas não testado |

### PRIORIDADE ALTA:
1. Paginação na página `/loja`
2. Índices no Supabase (slug, category_slug, featured)
3. Full-text search (Supabase `to_tsvector`)

---

## 10. SEO

| Item | Status |
|------|--------|
| URLs amigáveis | ✅ |
| Meta title | ✅ |
| Meta description | ⚠️ (só produto) |
| Schema Product (JSON-LD) | ❌ |
| Schema Breadcrumb | ❌ |
| Sitemap XML | ❌ |
| Robots.txt | ❌ |
| Canonical | ❌ |
| Alt text | ✅ |
| Redirects 301 | ❌ |
| Página 404 | ❌ |
| Blog | ❌ |
| Heading structure | ✅ |

### PRIORIDADE ALTA:
1. Sitemap XML dinâmico (`/sitemap.xml`)
2. Robots.txt
3. Schema.org Product JSON-LD
4. Página 404 customizada
5. Meta description em todas as páginas

---

## 11. E-MAILS E NOTIFICAÇÕES

| Item | Status |
|------|--------|
| Pedido recebido | ❌ |
| Pagamento aprovado | ❌ |
| Pagamento recusado | ❌ |
| Pedido enviado | ❌ |
| Código de rastreio | ❌ |
| Carrinho abandonado | ❌ |
| Recuperação de senha | ❌ |
| Cadastro realizado | ❌ |
| Reembolso | ❌ |

**Status: ZERO emails transacionais implementados.**

### PRIORIDADE CRÍTICA:
1. Setup de email transacional (Resend, SendGrid ou Supabase Edge Functions)
2. Templates: pedido confirmado, pagamento aprovado, enviado
3. Recuperação de senha

---

## 12. MONITORAMENTO

| Item | Status |
|------|--------|
| Logs centralizados | ❌ |
| Monitoramento uptime | ❌ |
| Alertas de erro | ❌ |
| Alertas de pagamento | ❌ |
| Monitoramento performance | ❌ |
| Ambiente staging | ⚠️ (Vercel Preview) |
| Deploy seguro | ✅ (auto-deploy main) |
| Versionamento | ✅ (Git) |
| Testes automatizados | ❌ |

### PRIORIDADE ALTA:
1. Sentry para error tracking
2. Uptime monitoring (Vercel Analytics ou BetterStack)
3. Alertas de webhook/pagamento falhando

---

## ROADMAP POR PRIORIDADE

### 🔴 CRÍTICO (fazer antes de vender)
1. Validação de assinatura webhook MercadoPago
2. Páginas de Política de Privacidade + Termos (LGPD)
3. Banner de cookies
4. Email transacional (pelo menos: confirmação de pedido + pagamento)
5. Recuperação de senha
6. Rate limiting nas APIs
7. Security headers

### 🟠 ALTA (fazer no primeiro mês)
8. Sitemap + Robots.txt + Schema.org
9. Página 404 customizada
10. Error boundaries
11. GA4 + GTM
12. Nota fiscal eletrônica
13. Audit log administrativo
14. Idempotency no checkout
15. Tabela payment_logs
16. Paginação na loja
17. Galeria de imagens (múltiplas fotos)
18. Relatórios de vendas

### 🟡 MÉDIA (próximos 2-3 meses)
19. Rastreamento de pedidos
20. WhatsApp Business API
21. Carrinho abandonado (email)
22. Avaliações de produtos
23. SKU
24. Variações de produto
25. Full-text search
26. Pixel Meta
27. Cross-sell no checkout
28. Boleto como pagamento
29. 2FA admin
30. Sentry error tracking

### 🟢 BAIXA (evolução contínua)
31. Blog/conteúdo
32. ERP
33. CRM
34. Marketplace
35. Testes automatizados
36. Google Merchant Center
37. Permissões por equipe
38. Relatórios financeiros avançados

---

## PRÓXIMOS PASSOS RECOMENDADOS

Começar pelo bloco CRÍTICO na seguinte ordem:
1. Security headers + rate limit (protege o que já existe)
2. Webhook signature validation (evita fraude)
3. Recuperação de senha (funcionalidade básica esperada)
4. Emails transacionais (experiência mínima do cliente)
5. Páginas LGPD (obrigação legal)
6. Banner de cookies (obrigação legal)

Depois seguir para SEO (sitemap, schema) e tracking (GA4) para começar a medir resultados.

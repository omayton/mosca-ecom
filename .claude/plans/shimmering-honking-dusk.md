# Plano: Migrar para Checkout Transparente MercadoPago

## Context

O checkout atual usa Checkout Pro (redirect para MercadoPago). O usuário quer Checkout Transparente — pagamento acontece dentro do site, sem sair. Isso melhora conversão e dá controle total sobre a UX.

A base (pedido, endereço, frete, webhook, histórico) já está pronta e não muda. Apenas o step de pagamento e a API de criação de pagamento precisam ser refatorados.

---

## O que muda

### 1. `src/lib/mercadopago.ts` — adicionar `createPayment` e `createPixPayment`

Manter `getPayment` (usado pelo webhook). Remover `createPreference` (não será mais usado). Adicionar:

- `createPayment(params)` — cria pagamento com cartão tokenizado via `POST /v1/payments`
- `createPixPayment(params)` — cria pagamento PIX via `POST /v1/payments` com `payment_method_id: "pix"`

Ambos recebem: orderId, total, description, payer (email, cpf, name), e o token/installments no caso de cartão.

### 2. `src/app/api/checkout/route.ts` — separar criação de pedido do pagamento

Refatorar para:
- Criar o pedido no Supabase (como hoje)
- **Não** criar preferência MercadoPago
- Retornar `{ orderId }` apenas

### 3. Novo: `src/app/api/payments/route.ts` — processar pagamento

Novo endpoint que recebe:
- `orderId` — pedido já criado
- `paymentMethod`: `"credit_card"` | `"pix"`
- Para cartão: `token` (gerado pelo SDK JS no client), `installments`, `issuer_id`
- Para PIX: nada extra

Lógica:
- Valida auth e que o pedido pertence ao usuário
- Busca o pedido para pegar total
- Chama `createPayment` ou `createPixPayment`
- Atualiza `orders.payment_id`, `orders.payment_method`
- Retorna:
  - Cartão: `{ status, status_detail }` (approved/rejected/in_process)
  - PIX: `{ qr_code, qr_code_base64, ticket_url, expiration }` (para exibir QR)

### 4. `src/components/checkout/payment-form.tsx` — novo componente (client)

Substitui o `OrderSummary` no step "review". Contém:
- Tabs: **Cartão** | **PIX**
- Tab Cartão:
  - Carrega SDK JS do MercadoPago via `<Script>` do next/script
  - Usa `window.MercadoPago` para criar `cardForm` ou tokenizar manualmente
  - Campos: número do cartão, validade, CVV, titular, parcelas (dropdown)
  - Ao submeter: tokeniza → POST `/api/payments` com token
  - Mostra resultado inline (aprovado/rejeitado)
- Tab PIX:
  - Botão "Gerar PIX"
  - POST `/api/payments` com method=pix
  - Exibe QR code (imagem base64) + código copia-e-cola
  - Timer de expiração

### 5. `src/app/checkout/page.tsx` — ajustar step "review"

- Após criar pedido (POST `/api/checkout`), guardar `orderId` no state
- Mostrar `PaymentForm` passando `orderId` e `total`
- Após pagamento aprovado: `clearCart()` + redirect para `/pedido/{orderId}?status=approved`
- Após PIX gerado: mostrar QR e manter na página (webhook atualiza status)

### 6. `src/components/checkout/order-summary.tsx` — simplificar

Remover o botão "Pagar com MercadoPago". Agora é apenas resumo visual (itens + totais), exibido acima do `PaymentForm`.

### 7. Env var nova

```
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=   # Public key para o SDK JS (tokenização client-side)
```

---

## Arquivos modificados

| Arquivo | Mudança |
|---------|---------|
| `src/lib/mercadopago.ts` | Remove `createPreference`, adiciona `createPayment` + `createPixPayment` |
| `src/app/api/checkout/route.ts` | Remove criação de preferência, retorna só `orderId` |
| `src/app/api/payments/route.ts` | **Novo** — processa pagamento cartão/PIX |
| `src/components/checkout/payment-form.tsx` | **Novo** — form de cartão + PIX inline |
| `src/components/checkout/order-summary.tsx` | Remove botão, vira só resumo |
| `src/app/checkout/page.tsx` | Ajusta flow: cria pedido → mostra payment form |

**Não muda:** webhook, address-form, shipping-selector, checkout-steps, pedido/[id], minha-conta, middleware, profile API.

---

## Verificação

1. `npx tsc --noEmit` sem erros
2. Fluxo cartão: checkout → preencher dados → tokenizar → pagamento aprovado → redirect confirmação
3. Fluxo PIX: checkout → gerar PIX → QR exibido → webhook confirma → status atualiza
4. Pagamento rejeitado: mensagem de erro inline, permite tentar novamente

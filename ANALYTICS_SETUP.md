# 📊 Configuração de Analytics

## Opção 1: Vercel Analytics (Gratuito & Automático)

### Passo 1: Habilitar no Vercel
1. Acesse [Vercel Dashboard](https://vercel.com/dashboard)
2. Selecione o projeto `mosca-ecom-main`
3. Vá em **Settings** → **Analytics**
4. Clique em **Enable Vercel Analytics**

### Passo 2: Ver dados
- No dashboard do projeto, clique na aba **Analytics**
- Ver page views, visitantes, top pages, etc.

---

## Opção 2: Vercel Web Analytics (Novo, Privacy-Friendly)

### Passo 1: Obter ID
1. Acesse [Vercel Web Analytics](https://vercel.com/analytics)
2. Clique em **Add New Project**
3. Selecione seu projeto
4. Copie o **Project ID** (formato: `wa_XXXX...`)

### Passo 2: Adicionar env var
No Vercel Dashboard → Settings → Environment Variables:
```
NEXT_PUBLIC_VERCEL_ANALYTICS_ID = wa_XXXX...
```

### Passo 3: Deploy
- Faça push e deploy automaticamente ativa o script

---

## Opção 3: Google Analytics 4 + GTM

### Passo 1: Criar conta GA4
1. Acesse [analytics.google.com](https://analytics.google.com)
2. Crie uma conta ou use existente
3. Crie uma **Propriedade GA4**
4. Copie o **Measurement ID** (formato: `G-XXXXXXXXXX`)

### Passo 2: Criar container GTM
1. Acesse [tagmanager.google.com](https://tagmanager.google.com)
2. Clique em **Criar conta** → escolha nome "Mosca Branca Parts"
3. Crie um **Container** (domínio: moscabran caparts.com.br)
4. Copie o **Container ID** (formato: `GTM-XXXXXXX`)

### Passo 3: Configurar GA4 no GTM
1. Dentro do GTM, vá em **Tags** → **Nova**
2. Escolha **Google Analytics: GA4 Configuration**
3. Cole o Measurement ID (`G-XXXXXXXXXX`)
4. Nomeie como "GA4 Config"
5. **Trigger**: All Pages

### Passo 4: Adicionar Tag Page View
1. Nova Tag → **Google Analytics: GA4 Event**
2. Tag de configuração: "GA4 Config"
3. Nome do evento: `page_view`
4. Trigger: All Pages

### Passo 5: Adicionar env var
No Vercel Dashboard → Settings → Environment Variables:
```
NEXT_PUBLIC_GTM_ID = GTM-XXXXXXX
```

### Passo 6: Deploy
- Faça push e o GTM será carregado automaticamente

---

## 📈 Rastrear eventos de e-commerce

Use `trackEvent()` para rastrear ações importantes:

```typescript
import { trackEvent } from '@/components/analytics'

// Adicionar ao carrinho
trackEvent('add_to_cart', {
  item_name: product.name,
  item_id: product.id,
  price: product.price,
  quantity: 1,
})

// Remover do carrinho
trackEvent('remove_from_cart', {
  item_id: product.id,
  price: product.price,
})

// Iniciar checkout
trackEvent('begin_checkout', {
  value: cartTotal,
  items: cartItems.length,
})

// Purchase (compra)
trackEvent('purchase', {
  transaction_id: orderId,
  value: orderTotal,
  currency: 'BRL',
  items: orderItems,
})
```

---

## 🎯 Meta Pixel (Facebook/Instagram)

### Adicionar via GTM (recomendado)
1. No GTM, crie uma nova Tag
2. Tipo: **Custom HTML**
3. Cole o script do Meta Pixel
4. Trigger: All Pages

Ou adicione diretamente no GTM usando a integração nativa.

---

## 🔍 Verificação

### Verificar se GTM está funcionando:
1. Instale a extensão [Tag Assistant](https://tagassistant.google.com/)
2. Abra seu site
3. Clique no ícone do Tag Assistant
4. Deve mostrar "GTM-XXXXXXX" ativo

### Verificar GA4:
1. No GA4, vá em **Relatórios** → **Tempo real**
2. Abra seu site em outra aba
3. Deve aparecer como usuário ativo

### Verificar Vercel Analytics:
1. No Vercel Dashboard → Analytics
2. Deve mostrar page views em tempo real

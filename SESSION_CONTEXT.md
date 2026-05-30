# Contexto da Sessão — Mosca Branca Ecom (Cálculo de Frete)

## O que foi feito

1. **Helpers de parse** em `src/lib/products.ts`:
   - `parseWeight("0,1 kg") → 0.1`
   - `parseDimensions("18×15×18 cm") → { width: 18, height: 15, length: 18 }`

2. **API Route** `src/app/api/shipping/calculate/route.ts`:
   - POST com `{ cep, weight, width, height, length }`
   - Chama `https://melhorenvio.com.br/api/v2/me/shipment/calculate`
   - Usa `MELHOR_ENVIO_TOKEN` e `MELHOR_ENVIO_CEP_ORIGEM` do env
   - Retorna array: `{ id, name, company, price, delivery_time }`

3. **Componente** `src/components/shipping-calculator.tsx`:
   - Client component com input de CEP (máscara 00000-000)
   - Botão calcular, estados loading/erro/resultado
   - Lista opções com transportadora, preço e prazo

4. **Integração** em `src/app/produto/[slug]/page.tsx`:
   - Importa ShippingCalculator e helpers
   - Parseia weight/dimensions do produto
   - Renderiza abaixo do bloco de garantias

5. **`.env.local.example`** criado com template

6. **Variáveis na Vercel** configuradas:
   - `MELHOR_ENVIO_TOKEN` = token JWT completo
   - `MELHOR_ENVIO_CEP_ORIGEM` = `38190000`

## Status atual

- Código commitado e pushado para `main`
- Deploy na Vercel ativo
- **Problema**: ao testar no site, retorna erro 502 ("Erro ao consultar frete")
- Causa provável: a API do Melhor Envio pode estar rejeitando a request (token expirado, formato incorreto, ou endpoint errado)

## Próximos passos

1. Melhorar error handling na route pra logar o erro real do Melhor Envio
2. Verificar se o token é de produção (não sandbox) — URL sandbox seria `https://sandbox.melhorenvio.com.br/api/v2/me/shipment/calculate`
3. Testar localmente com `npm run dev` e `.env.local` pra ver o erro detalhado
4. Se o token for sandbox, trocar a URL na route

## Arquivos relevantes

- `src/app/api/shipping/calculate/route.ts`
- `src/components/shipping-calculator.tsx`
- `src/app/produto/[slug]/page.tsx`
- `src/lib/products.ts`
- `.env.local.example`

## Variáveis de ambiente necessárias

```
MELHOR_ENVIO_TOKEN=<token JWT do Melhor Envio>
MELHOR_ENVIO_CEP_ORIGEM=38190000
```

## Repo

- GitHub: `github.com:omayton/mosca-ecom.git`
- Branch: `main`
- Vercel: conectado ao repo, deploy automático no push

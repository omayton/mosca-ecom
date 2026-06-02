import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/require-admin'

export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  try {
    const { productName, productDescription, productPrice, template } = await req.json()

    if (!productName) {
      return NextResponse.json({ error: 'Nome do produto é obrigatório.' }, { status: 400 })
    }

    const AI_GATEWAY_URL = process.env.VERCEL_AI_GATEWAY_URL
    const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY

    if (!AI_GATEWAY_URL || !ANTHROPIC_API_KEY) {
      // Fallback sem IA
      return NextResponse.json({
        tag: 'Destaque',
        title: productName,
        subtitle: productDescription?.slice(0, 80) || 'Peça rara de alta qualidade',
        ctaText: 'Comprar agora'
      })
    }

    const templateContext: Record<string, string> = {
      hero: 'Banner principal da loja. Tom premium, exclusividade, peça rara.',
      promo: 'Banner de promoção. Tom urgente, desconto, oportunidade única.',
      launch: 'Banner de lançamento. Tom novidade, primeiro a ter, exclusivo.',
      category: 'Banner de categoria. Tom informativo, variedade, encontre o que precisa.'
    }

    const prompt = `Você é um copywriter especialista em e-commerce automotivo brasileiro. Crie textos para um banner de venda.

Produto: ${productName}
Descrição: ${productDescription || 'Peça automotiva rara'}
Preço: R$ ${productPrice || '—'}
Contexto: ${templateContext[template] || templateContext.hero}

Gere EXATAMENTE este JSON (sem markdown, sem explicação):
{
  "tag": "texto curto de 1-2 palavras para a tag (ex: Exclusivo, Lançamento, -30%, Raro)",
  "title": "headline impactante de no máximo 6 palavras",
  "subtitle": "frase de apoio com benefício principal, máximo 15 palavras",
  "ctaText": "texto do botão de ação, 2-3 palavras"
}

Regras:
- Português brasileiro
- Tom premium e exclusivo (peças raras automotivas)
- Headline curta e impactante
- Subtítulo com benefício claro
- CTA direto e urgente`

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)

    const res = await fetch(`${AI_GATEWAY_URL}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ANTHROPIC_API_KEY}`,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }]
      }),
      signal: controller.signal
    })

    clearTimeout(timeout)

    if (!res.ok) {
      throw new Error(`AI API failed: ${res.status}`)
    }

    const data = await res.json()
    const content = data.content?.[0]?.text

    if (!content) throw new Error('No content')

    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('Could not parse')

    const copy = JSON.parse(jsonMatch[0])

    return NextResponse.json(copy)
  } catch (error) {
    console.error('Banner copy generation error:', error)
    // Fallback
    return NextResponse.json({
      tag: 'Destaque',
      title: 'Peça Rara Disponível',
      subtitle: 'Encaixe original, sem adaptações necessárias',
      ctaText: 'Comprar agora'
    })
  }
}
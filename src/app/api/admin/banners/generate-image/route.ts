import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/require-admin'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  try {
    const { productName, productImageUrl, instructions } = await req.json()

    if (!productName) {
      return NextResponse.json({ error: 'Nome do produto é obrigatório.' }, { status: 400 })
    }

    const openaiKey = process.env.OPENAI_API_KEY
    if (!openaiKey) {
      return NextResponse.json({ error: 'OPENAI_API_KEY não configurada.' }, { status: 500 })
    }

    const prompt = `Create a premium e-commerce banner for an automotive parts store called "Mosca Branca Parts".
Product: ${productName}.
${instructions ? `Style instructions: ${instructions}.` : ''}
Requirements:
- Horizontal banner, 1440x480px proportions
- Dark, premium automotive aesthetic (blacks, deep grays, metallic accents)
- The product should be the hero element, prominently displayed
- Professional studio lighting with dramatic shadows
- NO text, NO words, NO letters anywhere in the image
- Background: deep dark gradient (near black)
- Subtle red accent lighting (brand color #dc2626)
- High-end commercial photography style
- Clean, minimal composition`

    const openaiRes = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt,
        n: 1,
        size: '1536x1024',
      }),
    })

    if (!openaiRes.ok) {
      const err = await openaiRes.json().catch(() => ({}))
      console.error('OpenAI error:', err)
      return NextResponse.json(
        { error: 'Erro ao chamar OpenAI: ' + (err?.error?.message || openaiRes.statusText) },
        { status: 500 }
      )
    }

    const openaiData = await openaiRes.json()

    // gpt-image-1 retorna base64, dall-e-3 retorna url — suporta ambos
    const imageData = openaiData.data?.[0]
    if (!imageData) {
      return NextResponse.json({ error: 'OpenAI não retornou imagem.' }, { status: 500 })
    }

    let buffer: Buffer
    if (imageData.b64_json) {
      buffer = Buffer.from(imageData.b64_json, 'base64')
    } else if (imageData.url) {
      const imgRes = await fetch(imageData.url)
      if (!imgRes.ok) {
        return NextResponse.json({ error: 'Erro ao baixar imagem gerada.' }, { status: 500 })
      }
      buffer = Buffer.from(await imgRes.arrayBuffer())
    } else {
      return NextResponse.json({ error: 'Formato de resposta inesperado da OpenAI.' }, { status: 500 })
    }

    const supabase = getSupabase()
    const fileName = `banner-ai-${Date.now()}.png`
    const filePath = `banners/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, buffer, { contentType: 'image/png', upsert: false })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return NextResponse.json({ error: 'Erro ao salvar imagem no storage.' }, { status: 500 })
    }

    const { data: urlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath)

    return NextResponse.json({ success: true, url: urlData.publicUrl })
  } catch (error) {
    console.error('generate-image error:', error)
    return NextResponse.json({ error: 'Erro na geração da imagem.' }, { status: 500 })
  }
}

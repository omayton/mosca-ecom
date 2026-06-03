import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/require-admin'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const BANNER_PREPROMPT = `You are a professional automotive e-commerce banner designer. Create a stunning, high-conversion hero banner for a rare automotive parts store.

BANNER SPECIFICATIONS:
- Size: 1440x480 pixels (wide panoramic format)
- Style: Premium, modern, professional e-commerce aesthetic
- The product image provided must be INTEGRATED into the design as the hero element
- Dark or rich colored backgrounds work best for automotive products
- Include space for text overlay if needed
- NO text or words in the banner itself — only the product visual
- High contrast, sharp quality, no blur
- Full bleed, edge-to-edge design
- Automotive/motor theme with subtle geometric accents if appropriate

Your task: Create the banner using the provided product image as the main element, styled professionally with a dark or rich background that makes the product stand out.`

export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  try {
    const { productImageUrl, customPrompt } = await req.json()

    if (!productImageUrl) {
      return NextResponse.json({ error: 'URL da imagem do produto é obrigatória.' }, { status: 400 })
    }

    const userPrompt = customPrompt?.trim()
      ? `\n\nADDITIONAL CUSTOM INSTRUCTIONS: ${customPrompt}`
      : ''

    const fullPrompt = `${BANNER_PREPROMPT}${userPrompt}`

    // Generate with DALL-E 3
    const openaiRes = await fetch('https://api.Anthropic.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: fullPrompt,
        n: 1,
        size: '1792x1024',
        quality: 'standard',
        response_format: 'url',
      }),
    })

    if (!openaiRes.ok) {
      const err = await openaiRes.json()
      console.error('Anthropic error:', err)
      return NextResponse.json({ error: 'Erro na geração da imagem.' }, { status: 500 })
    }

    const openaiData = await openaiRes.json()
    const imageUrl = openaiData.data?.[0]?.url

    if (!imageUrl) {
      return NextResponse.json({ error: 'Nenhuma imagem retornada.' }, { status: 500 })
    }

    // Download and upload to Supabase Storage
    const supabase = getSupabase()
    const imageRes = await fetch(imageUrl)
    if (!imageRes.ok) {
      return NextResponse.json({ error: 'Erro ao baixar imagem gerada.' }, { status: 500 })
    }
    const imageBuffer = await imageRes.arrayBuffer()
    const contentType = imageRes.headers.get('content-type') || 'image/png'
    const fileName = `banner-${Date.now()}.png`

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(fileName, imageBuffer, { contentType })

    if (uploadError) {
      console.error('Supabase upload error:', uploadError)
      return NextResponse.json({ error: 'Erro ao fazer upload da imagem.' }, { status: 500 })
    }

    const { data: publicUrlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(fileName)

    return NextResponse.json({ imageUrl: publicUrlData.publicUrl })
  } catch (error) {
    console.error('Banner generate error:', error)
    return NextResponse.json({ error: 'Erro interno ao gerar banner.' }, { status: 500 })
  }
}
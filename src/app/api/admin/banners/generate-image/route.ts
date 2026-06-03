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

    const instructions_text = instructions?.trim()
      ? instructions
      : 'desconto especial, fundo escuro com vermelho'

    const prompt = `Create a complete, ready-to-use promotional e-commerce banner image for a Brazilian automotive parts store called "Mosca Branca Parts".

PRODUCT: "${productName}" — use the reference photo exactly, keep shape and color.
STYLE INSTRUCTIONS: ${instructions_text}

SAFE ZONE RULES (critical — must follow):
- Keep ALL content (text, product, buttons, icons) at least 80px away from every edge (left, right, top, bottom)
- The outer 80px border of the image must be ONLY background — no text, no product parts, no UI elements bleeding to the edge
- Think of it as a frame: content lives inside the inner safe area, edges are clean background only
- Product image must not be cropped or cut — show it fully within the safe zone

BANNER COMPOSITION (wide horizontal format, like 1536x1024):
- LEFT SIDE (inside safe zone): Large bold promotional headline in Portuguese, example: "Peça Rara Encontrada!" or "Oferta Exclusiva!" — white or yellow bold font, big and impactful
- CENTER (inside safe zone): A discount badge or highlight, example: "ATÉ 20% OFF" or "FRETE GRÁTIS" in a colored box or circle (red #dc2626 or yellow)
- RIGHT SIDE (inside safe zone): The product from the reference photo, large, well-lit, floating with drop shadow — fully visible, not cropped
- BOTTOM RIGHT (inside safe zone): A CTA button shape: "Comprar Agora →" in dark red or black pill shape
- BACKGROUND: Dark gradient (very dark charcoal or near-black), with subtle red accent glow (#dc2626) behind the product. Background fills the entire image edge-to-edge
- Optional: small brand text "Mosca Branca Parts" bottom left, inside safe zone
- Trust icon strip near bottom: small icons like shield, star, truck — inside safe zone

STYLE:
- Brazilian automotive e-commerce aesthetic — bold, high contrast, professional
- Font style: heavy/black weight, impactful
- Colors: dark background, red accent (#dc2626), white text, optional yellow highlight
- Photorealistic product, graphic design composition for the rest
- High production quality, commercial banner standard
- All text in PORTUGUESE (Brazil)`

    let buffer: Buffer

    // Se tem imagem do produto, usa o endpoint de edição (resultado muito melhor)
    if (productImageUrl) {
      try {
        const imgFetch = await fetch(productImageUrl)
        if (imgFetch.ok) {
          const imgBuffer = Buffer.from(await imgFetch.arrayBuffer())
          const contentType = imgFetch.headers.get('content-type') || 'image/png'
          const ext = contentType.includes('jpg') || contentType.includes('jpeg') ? 'jpg' : 'png'

          const formData = new FormData()
          formData.append('model', 'gpt-image-1')
          formData.append('prompt', prompt)
          formData.append('n', '1')
          formData.append('size', '1536x1024')
          formData.append(
            'image',
            new Blob([imgBuffer], { type: contentType }),
            `product.${ext}`
          )

          const editRes = await fetch('https://api.openai.com/v1/images/edits', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${openaiKey}` },
            body: formData,
          })

          if (editRes.ok) {
            const editData = await editRes.json()
            const imageData = editData.data?.[0]
            if (imageData?.b64_json) {
              buffer = Buffer.from(imageData.b64_json, 'base64')
            } else if (imageData?.url) {
              const r = await fetch(imageData.url)
              buffer = Buffer.from(await r.arrayBuffer())
            } else {
              throw new Error('sem imagem na resposta de edição')
            }
          } else {
            // fallback para geração pura se edição falhar
            const err = await editRes.json().catch(() => ({}))
            console.warn('Image edit failed, falling back to generation:', err)
            buffer = await generateFromText(openaiKey, prompt)
          }
        } else {
          buffer = await generateFromText(openaiKey, prompt)
        }
      } catch (e) {
        console.warn('Edit endpoint error, falling back:', e)
        buffer = await generateFromText(openaiKey, prompt)
      }
    } else {
      buffer = await generateFromText(openaiKey, prompt)
    }

    const supabase = getSupabase()
    const filePath = `banners/banner-ai-${Date.now()}.png`

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

async function generateFromText(openaiKey: string, prompt: string): Promise<Buffer> {
  const res = await fetch('https://api.openai.com/v1/images/generations', {
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

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error('Erro ao chamar OpenAI: ' + (err?.error?.message || res.statusText))
  }

  const data = await res.json()
  const imageData = data.data?.[0]

  if (imageData?.b64_json) return Buffer.from(imageData.b64_json, 'base64')
  if (imageData?.url) {
    const r = await fetch(imageData.url)
    return Buffer.from(await r.arrayBuffer())
  }
  throw new Error('OpenAI não retornou imagem.')
}

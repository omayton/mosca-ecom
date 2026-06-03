import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/require-admin'
import sharp from 'sharp'

// Banner ratio: full width × max 480px → ~3:1
// gpt-image-1 only supports 1536x1024 (1.5:1), so we crop to 1536x512 (exact 3:1)
const BANNER_W = 1536
const BANNER_H = 512

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

DIMENSIONS & SAFE ZONE — ABSOLUTE RULES:
- The final image will be CENTER-CROPPED to a 3:1 wide banner (like 1536x512)
- This means the TOP 25% and BOTTOM 25% of your image will be CUT OFF
- Therefore: place ALL content ONLY in the middle 50% vertically — the horizontal center band
- Left and right edges: keep 100px margin — nothing touches the sides
- Background fills the entire image, content lives only in the center band
- Product must be fully visible within the center band, not cropped

COMPOSITION (content lives only inside the safe zone):
- Scale everything to fit comfortably — content should feel airy, not cramped or overflowing
- LEFT SIDE: Compact promotional headline in Portuguese (2–3 short lines max), Ubuntu font, bold/black weight, white or yellow, font size moderate — NOT huge
- CENTER or LEFT-CENTER: Small discount badge "ATÉ 20% OFF" or "FRETE GRÁTIS" — compact rounded pill or box, red (#dc2626) or yellow, not oversized
- RIGHT SIDE: Product from reference photo — medium size, perfectly centered vertically, full product visible, soft drop shadow beneath it
- BOTTOM area (inside safe zone): Small CTA button "Comprar Agora →" pill shape, red or dark, compact size
- Small text "Mosca Branca Parts" — very subtle, bottom-left corner (inside safe zone)

TYPOGRAPHY:
- Font: Ubuntu (sans-serif, geometric, clean) — use for all text
- Headline: Ubuntu Bold or Black weight
- Body/badge: Ubuntu Regular or Medium
- All text in PORTUGUESE (Brazil)

BACKGROUND & STYLE:
- Very dark charcoal or near-black gradient, fills edge-to-edge
- Subtle red glow (#dc2626) radiating softly behind the product
- Brazilian automotive e-commerce premium look
- High contrast, sharp, photorealistic product on graphic background
- Overall feel: spacious, professional, breathing room on all sides`

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

    // Crop to exact banner ratio (3:1) — center crop from the generated 1536x1024
    const croppedBuffer = await sharp(buffer)
      .resize({
        width: BANNER_W,
        height: BANNER_H,
        fit: 'cover',
        position: 'centre',
      })
      .png()
      .toBuffer()

    const supabase = getSupabase()
    const filePath = `banners/banner-ai-${Date.now()}.png`

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, croppedBuffer, { contentType: 'image/png', upsert: false })

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

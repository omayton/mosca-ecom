import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/require-admin'

// sharp is loaded dynamically — available on Vercel but may not be installed locally
async function getSharp() {
  try {
    // @ts-ignore sharp may not be installed locally
    const mod = await import('sharp')
    return mod.default || mod
  } catch {
    return null
  }
}

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

    const prompt = `Create a BACKGROUND IMAGE for an automotive e-commerce hero banner. This image will have HTML text overlaid on top, so the image itself must contain NO text whatsoever.

PRODUCT: "${productName}" — use the reference photo, keep exact shape and color.
${instructions_text !== 'desconto especial, fundo escuro com vermelho' ? `STYLE: ${instructions_text}` : ''}

PURPOSE: This is a background/atmosphere image only. Clean HTML text will be placed over it later.

COMPOSITION:
- Wide landscape format (3:1 ratio — very wide, short height)
- RIGHT HALF: The product, photorealistic, studio quality, well-lit with a soft spotlight from above-left. Product floats slightly with a soft drop shadow. Fully visible, not cropped. Takes up about 35–40% of image width
- LEFT HALF: Empty dark space — this is where text will go. Keep it very clean, dark, and uncluttered. A very subtle vignette or texture is fine, but no objects, no shapes, nothing distracting
- CENTER: Soft transition between dark left and product right

BACKGROUND ATMOSPHERE:
- Very dark: deep charcoal (#111111 to #1a1a1a) or very dark navy/maroon depending on product
- Subtle radial glow behind the product only — dark red (#dc2626 at very low opacity ~15%) or matching brand tone
- Very faint noise/grain texture for premium feel (optional)
- NO geometric shapes, NO lines, NO patterns on the left side — keep it pure dark

LIGHTING ON PRODUCT:
- Cinematic studio lighting — main light from upper-left, subtle rim light from behind-right
- Product looks sharp, premium, photorealistic
- Soft shadow beneath product on the floor/surface

ABSOLUTE RULES:
- ZERO text, ZERO words, ZERO letters, ZERO numbers anywhere
- ZERO UI elements (no buttons, badges, icons)
- Left side must be very dark and empty — the HTML overlay depends on this
- Fill the entire frame edge-to-edge with background`

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
    const sharpLib = await getSharp()
    let croppedBuffer: Buffer

    if (sharpLib) {
      croppedBuffer = await sharpLib(buffer)
        .resize({
          width: BANNER_W,
          height: BANNER_H,
          fit: 'cover',
          position: 'centre',
        })
        .png()
        .toBuffer()
    } else {
      // Fallback: upload sem crop se sharp não disponível
      croppedBuffer = buffer
    }

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

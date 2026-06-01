import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const productId = formData.get('productId') as string | null

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 })
    }

    // Validar tipo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de arquivo não permitido. Use JPG, PNG, WebP ou GIF.' },
        { status: 400 }
      )
    }

    // Validar tamanho (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Arquivo muito grande. Máximo 5MB.' },
        { status: 400 }
      )
    }

    const supabase = getSupabase()

    // Gerar nome único
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const timestamp = Date.now()
    const safeName = file.name
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9-_]/g, '-')
      .toLowerCase()
      .slice(0, 50)
    const fileName = `${safeName}-${timestamp}.${ext}`
    const filePath = productId ? `products/${productId}/${fileName}` : `products/temp/${fileName}`

    // Upload para Supabase Storage
    const buffer = Buffer.from(await file.arrayBuffer())

    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false
      })

    if (error) {
      console.error('Upload error:', error)
      return NextResponse.json({ error: 'Erro ao fazer upload.' }, { status: 500 })
    }

    // Gerar URL pública
    const { data: urlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath)

    const publicUrl = urlData.publicUrl

    // Se tem productId, atualizar o produto
    if (productId) {
      await supabase
        .from('products')
        .update({ image_file: publicUrl })
        .eq('id', productId)
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
      path: filePath,
      fileName
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Erro interno no upload.' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const path = searchParams.get('path')

    if (!path) {
      return NextResponse.json({ error: 'Path é obrigatório.' }, { status: 400 })
    }

    const supabase = getSupabase()

    const { error } = await supabase.storage
      .from('product-images')
      .remove([path])

    if (error) {
      console.error('Delete error:', error)
      return NextResponse.json({ error: 'Erro ao deletar imagem.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const productId = searchParams.get('productId')

    if (!productId) {
      return NextResponse.json({ error: 'productId obrigatório' }, { status: 400 })
    }

    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('product_images')
      .select('*')
      .eq('product_id', parseInt(productId))
      .order('sort_order', { ascending: true })

    if (error) throw error

    return NextResponse.json({ images: data })
  } catch (error) {
    console.error('Product images fetch error:', error)
    return NextResponse.json({ error: 'Erro ao buscar imagens.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const supabase = getSupabase()

    const { data, error } = await supabase
      .from('product_images')
      .insert({
        product_id: body.productId,
        url: body.url,
        alt_text: body.altText || '',
        sort_order: body.sortOrder || 0,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ image: data }, { status: 201 })
  } catch (error) {
    console.error('Product image create error:', error)
    return NextResponse.json({ error: 'Erro ao adicionar imagem.' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID obrigatório.' }, { status: 400 })
    }

    const supabase = getSupabase()
    const { error } = await supabase
      .from('product_images')
      .delete()
      .eq('id', parseInt(id))

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Product image delete error:', error)
    return NextResponse.json({ error: 'Erro ao excluir imagem.' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const supabase = getSupabase()

    if (!body.id) {
      return NextResponse.json({ error: 'ID obrigatório.' }, { status: 400 })
    }

    const updates: Record<string, any> = {}
    if (body.sortOrder !== undefined) updates.sort_order = body.sortOrder
    if (body.altText !== undefined) updates.alt_text = body.altText

    const { error } = await supabase
      .from('product_images')
      .update(updates)
      .eq('id', body.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Product image update error:', error)
    return NextResponse.json({ error: 'Erro ao atualizar imagem.' }, { status: 500 })
  }
}

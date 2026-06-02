import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function GET() {
  try {
    const supabase = getSupabase()

    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true })

    if (error) throw error

    return NextResponse.json({ categories: data })
  } catch (error) {
    console.error('Categories fetch error:', error)
    return NextResponse.json({ error: 'Erro ao buscar categorias.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const supabase = getSupabase()

    const slug = body.slug?.trim() || slugify(body.name)

    const { data, error } = await supabase
      .from('categories')
      .insert({
        name: body.name.trim(),
        slug,
        description: body.description || '',
        is_active: body.isActive ?? true,
        sort_order: body.sortOrder || 0,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Já existe uma categoria com este slug.' }, { status: 409 })
      }
      throw error
    }

    return NextResponse.json({ category: data }, { status: 201 })
  } catch (error) {
    console.error('Category create error:', error)
    return NextResponse.json({ error: 'Erro ao criar categoria.' }, { status: 500 })
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
    if (body.name !== undefined) updates.name = body.name.trim()
    if (body.slug !== undefined) updates.slug = body.slug.trim()
    if (body.description !== undefined) updates.description = body.description
    if (body.isActive !== undefined) updates.is_active = body.isActive
    if (body.sortOrder !== undefined) updates.sort_order = body.sortOrder

    const { data, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', body.id)
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Já existe uma categoria com este slug.' }, { status: 409 })
      }
      throw error
    }

    return NextResponse.json({ category: data })
  } catch (error) {
    console.error('Category update error:', error)
    return NextResponse.json({ error: 'Erro ao atualizar categoria.' }, { status: 500 })
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
      .from('categories')
      .delete()
      .eq('id', parseInt(id))

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Category delete error:', error)
    return NextResponse.json({ error: 'Erro ao excluir categoria.' }, { status: 500 })
  }
}

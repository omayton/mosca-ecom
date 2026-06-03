import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/require-admin'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(req: NextRequest) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  try {
    const { searchParams } = new URL(req.url)
    const activeOnly = searchParams.get('active') === 'true'

    const supabase = getSupabase()

    let query = supabase
      .from('banners')
      .select('*, products:product_id(name, price, image_file, slug)')
      .order('position', { ascending: true })

    if (activeOnly) {
      query = query.eq('is_active', true)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ banners: data })
  } catch (error) {
    console.error('Banners fetch error:', error)
    return NextResponse.json({ error: 'Erro ao buscar banners.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  try {
    const body = await req.json()
    const supabase = getSupabase()

    const { data, error } = await supabase
      .from('banners')
      .insert({
        title: body.title,
        subtitle: body.subtitle || null,
        tag: body.tag || null,
        cta_text: body.ctaText || 'Ver produtos',
        cta_link: body.ctaLink || '/loja',
        product_id: body.productId || null,
        product_image_url: body.productImageUrl || null,
        desktop_image_url: body.desktopImageUrl || null,
        mobile_image_url: body.mobileImageUrl || null,
        template: body.template || 'hero',
        bg_color: body.bgColor || '#0a0a0b',
        accent_color: body.accentColor || '#dc2626',
        text_color: body.textColor || '#ffffff',
        position: body.position || 0,
        is_active: body.isActive !== false,
        starts_at: body.startsAt || new Date().toISOString(),
        expires_at: body.expiresAt || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Banner create error:', error)
      return NextResponse.json({ error: 'Erro ao criar banner: ' + error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, banner: data })
  } catch (error) {
    console.error('Banner create error:', error)
    return NextResponse.json({ error: 'Erro ao criar banner.' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  try {
    const body = await req.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'ID do banner é obrigatório.' }, { status: 400 })
    }

    const supabase = getSupabase()

    const dbUpdates: any = {}
    if (updates.title !== undefined) dbUpdates.title = updates.title
    if (updates.subtitle !== undefined) dbUpdates.subtitle = updates.subtitle
    if (updates.tag !== undefined) dbUpdates.tag = updates.tag
    if (updates.ctaText !== undefined) dbUpdates.cta_text = updates.ctaText
    if (updates.ctaLink !== undefined) dbUpdates.cta_link = updates.ctaLink
    if (updates.productId !== undefined) dbUpdates.product_id = updates.productId
    if (updates.productImageUrl !== undefined) dbUpdates.product_image_url = updates.productImageUrl
    if (updates.desktopImageUrl !== undefined) dbUpdates.desktop_image_url = updates.desktopImageUrl
    if (updates.mobileImageUrl !== undefined) dbUpdates.mobile_image_url = updates.mobileImageUrl
    if (updates.template !== undefined) dbUpdates.template = updates.template
    if (updates.bgColor !== undefined) dbUpdates.bg_color = updates.bgColor
    if (updates.accentColor !== undefined) dbUpdates.accent_color = updates.accentColor
    if (updates.textColor !== undefined) dbUpdates.text_color = updates.textColor
    if (updates.position !== undefined) dbUpdates.position = updates.position
    if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive
    if (updates.startsAt !== undefined) dbUpdates.starts_at = updates.startsAt
    if (updates.expiresAt !== undefined) dbUpdates.expires_at = updates.expiresAt

    const { data, error } = await supabase
      .from('banners')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Banner update error:', error)
      return NextResponse.json({ error: 'Erro ao atualizar banner: ' + error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, banner: data })
  } catch (error) {
    console.error('Banner update error:', error)
    return NextResponse.json({ error: 'Erro ao atualizar banner.' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID do banner é obrigatório.' }, { status: 400 })
    }

    const supabase = getSupabase()

    const { error } = await supabase
      .from('banners')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Banner delete error:', error)
    return NextResponse.json({ error: 'Erro ao deletar banner.' }, { status: 500 })
  }
}
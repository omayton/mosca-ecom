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
    const active = searchParams.get('active')

    const supabase = getSupabase()

    let query = supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false })

    if (active === 'true') {
      query = query.eq('is_active', true)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ coupons: data })
  } catch (error) {
    console.error('Coupons fetch error:', error)
    return NextResponse.json({ error: 'Erro ao buscar cupons.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const supabase = getSupabase()

    const { data, error } = await supabase
      .from('coupons')
      .insert({
        code: body.code.toUpperCase().trim(),
        description: body.description || '',
        discount_type: body.discountType,
        discount_value: body.discountValue,
        min_order_value: body.minOrderValue || 0,
        max_uses: body.maxUses || null,
        max_uses_per_user: body.maxUsesPerUser || 1,
        starts_at: body.startsAt || new Date().toISOString(),
        expires_at: body.expiresAt || null,
        is_active: true,
        applies_to: body.appliesTo || 'all',
        applies_to_ids: body.appliesToIds || []
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, coupon: data })
  } catch (error: any) {
    if (error?.code === '23505') {
      return NextResponse.json({ error: 'Código de cupom já existe.' }, { status: 409 })
    }
    console.error('Coupon create error:', error)
    return NextResponse.json({ error: 'Erro ao criar cupom.' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'ID do cupom é obrigatório.' }, { status: 400 })
    }

    const supabase = getSupabase()

    const dbUpdates: any = {}
    if (updates.code !== undefined) dbUpdates.code = updates.code.toUpperCase().trim()
    if (updates.description !== undefined) dbUpdates.description = updates.description
    if (updates.discountType !== undefined) dbUpdates.discount_type = updates.discountType
    if (updates.discountValue !== undefined) dbUpdates.discount_value = updates.discountValue
    if (updates.minOrderValue !== undefined) dbUpdates.min_order_value = updates.minOrderValue
    if (updates.maxUses !== undefined) dbUpdates.max_uses = updates.maxUses
    if (updates.maxUsesPerUser !== undefined) dbUpdates.max_uses_per_user = updates.maxUsesPerUser
    if (updates.startsAt !== undefined) dbUpdates.starts_at = updates.startsAt
    if (updates.expiresAt !== undefined) dbUpdates.expires_at = updates.expiresAt
    if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive
    if (updates.appliesTo !== undefined) dbUpdates.applies_to = updates.appliesTo
    if (updates.appliesToIds !== undefined) dbUpdates.applies_to_ids = updates.appliesToIds

    const { data, error } = await supabase
      .from('coupons')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, coupon: data })
  } catch (error) {
    console.error('Coupon update error:', error)
    return NextResponse.json({ error: 'Erro ao atualizar cupom.' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID do cupom é obrigatório.' }, { status: 400 })
    }

    const supabase = getSupabase()

    const { error } = await supabase
      .from('coupons')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Coupon delete error:', error)
    return NextResponse.json({ error: 'Erro ao deletar cupom.' }, { status: 500 })
  }
}
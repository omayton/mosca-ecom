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
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status') || ''

    const supabase = getSupabase()
    const offset = (page - 1) * limit

    let query = supabase
      .from('orders')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) {
      query = query.eq('status', status)
    }

    const { data: orders, error, count } = await query
    if (error) throw error

    // Fetch customer names separately to avoid FK join issues
    const userIds = Array.from(new Set((orders || []).map((o: any) => o.user_id).filter(Boolean)))
    let profileMap: Record<string, string> = {}

    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, full_name')
        .in('id', userIds)

      if (profiles) {
        for (const p of profiles) {
          profileMap[p.id] = p.name || p.full_name || 'Cliente'
        }
      }
    }

    const enriched = (orders || []).map((o: any) => ({
      ...o,
      profiles: { name: profileMap[o.user_id] || null },
    }))

    return NextResponse.json({
      orders: enriched,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    })
  } catch (error) {
    console.error('Orders fetch error:', error)
    return NextResponse.json({ error: 'Erro ao buscar pedidos.' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  try {
    const { id, status } = await req.json()

    if (!id || !status) {
      return NextResponse.json({ error: 'ID e status são obrigatórios.' }, { status: 400 })
    }

    const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Status inválido.' }, { status: 400 })
    }

    const supabase = getSupabase()

    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, order: data })
  } catch (error) {
    console.error('Order update error:', error)
    return NextResponse.json({ error: 'Erro ao atualizar pedido.' }, { status: 500 })
  }
}
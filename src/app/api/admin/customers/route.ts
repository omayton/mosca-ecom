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
    const search = searchParams.get('search') || ''

    const supabase = getSupabase()
    const offset = (page - 1) * limit

    let query = supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (search) {
      query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`)
    }

    const { data, error, count } = await query

    if (error) throw error

    // Fetch order counts separately to avoid FK dependency issues
    let orderCounts: Record<string, number> = {}
    if (data && data.length > 0) {
      const userIds = data.map((p: any) => p.id)
      const { data: orderData } = await supabase
        .from('orders')
        .select('user_id')
        .in('user_id', userIds)

      if (orderData) {
        for (const o of orderData) {
          orderCounts[o.user_id] = (orderCounts[o.user_id] || 0) + 1
        }
      }
    }

    const customers = (data || []).map((p: any) => ({
      ...p,
      orders: [{ count: orderCounts[p.id] || 0 }]
    }))

    return NextResponse.json({
      customers,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    })
  } catch (error) {
    console.error('Customers fetch error:', error)
    return NextResponse.json({ error: 'Erro ao buscar clientes.' }, { status: 500 })
  }
}
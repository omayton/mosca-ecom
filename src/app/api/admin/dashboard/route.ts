import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/require-admin'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET() {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  try {
    const supabase = getSupabase()

    const [productsRes, ordersRes, customersRes, lowStockRes, todayOrdersRes] = await Promise.all([
      supabase.from('products').select('id', { count: 'exact', head: true }),
      supabase.from('orders').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('products').select('id', { count: 'exact', head: true }).lte('stock_quantity', 10).gt('stock_quantity', 0),
      supabase.from('orders').select('total').gte('created_at', new Date().toISOString().split('T')[0])
    ])

    const todayOrders = todayOrdersRes.data || []
    const revenueToday = todayOrders.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0)

    const hasData = (productsRes.count || 0) > 0 || (ordersRes.count || 0) > 0

    return NextResponse.json({
      totalProducts: productsRes.count || 0,
      totalOrders: ordersRes.count || 0,
      totalCustomers: customersRes.count || 0,
      lowStockCount: lowStockRes.count || 0,
      revenueToday,
      ordersToday: todayOrders.length,
      hasData
    })
  } catch (error) {
    console.error('Dashboard metrics error:', error)
    return NextResponse.json({
      totalProducts: 0,
      totalOrders: 0,
      totalCustomers: 0,
      lowStockCount: 0,
      revenueToday: 0,
      ordersToday: 0,
      hasData: false,
      apiError: true
    })
  }
}
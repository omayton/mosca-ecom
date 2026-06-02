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
    const now = new Date()
    const todayStr = now.toISOString().split('T')[0]

    // 7 days ago
    const weekAgo = new Date(now)
    weekAgo.setDate(weekAgo.getDate() - 7)
    const weekAgoStr = weekAgo.toISOString()

    // 14 days ago (for comparison)
    const twoWeeksAgo = new Date(now)
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)
    const twoWeeksAgoStr = twoWeeksAgo.toISOString()

    const [
      productsRes,
      totalOrdersRes,
      customersRes,
      lowStockRes,
      todayOrdersRes,
      weekOrdersRes,
      prevWeekOrdersRes,
      recentOrdersRes,
    ] = await Promise.all([
      supabase.from('products').select('id', { count: 'exact', head: true }),
      supabase.from('orders').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('products').select('id', { count: 'exact', head: true }).lte('stock_quantity', 10).gt('stock_quantity', 0),
      supabase.from('orders').select('total, status').gte('created_at', todayStr),
      supabase.from('orders').select('total, status, created_at').gte('created_at', weekAgoStr),
      supabase.from('orders').select('total, status').gte('created_at', twoWeeksAgoStr).lt('created_at', weekAgoStr),
      supabase.from('orders').select('id, total, status, created_at, shipping_method').order('created_at', { ascending: false }).limit(5),
    ])

    const todayOrders = todayOrdersRes.data || []
    const weekOrders = weekOrdersRes.data || []
    const prevWeekOrders = prevWeekOrdersRes.data || []
    const recentOrders = recentOrdersRes.data || []

    // Revenue calculations (only confirmed orders)
    const revenueToday = todayOrders
      .filter(o => o.status === 'confirmed')
      .reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0)

    const revenueWeek = weekOrders
      .filter(o => o.status === 'confirmed')
      .reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0)

    const revenuePrevWeek = prevWeekOrders
      .filter(o => o.status === 'confirmed')
      .reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0)

    // Calculate real trend percentage
    const revenueTrend = revenuePrevWeek > 0
      ? Math.round(((revenueWeek - revenuePrevWeek) / revenuePrevWeek) * 100)
      : revenueWeek > 0 ? 100 : 0

    const ordersThisWeek = weekOrders.length
    const ordersPrevWeek = prevWeekOrders.length
    const ordersTrend = ordersPrevWeek > 0
      ? Math.round(((ordersThisWeek - ordersPrevWeek) / ordersPrevWeek) * 100)
      : ordersThisWeek > 0 ? 100 : 0

    // Daily breakdown for chart (last 7 days)
    const dailyRevenue: { date: string; revenue: number; orders: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const dayOrders = weekOrders.filter(o => o.created_at?.startsWith(dateStr))
      const dayRevenue = dayOrders
        .filter(o => o.status === 'confirmed')
        .reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0)
      dailyRevenue.push({ date: dateStr, revenue: dayRevenue, orders: dayOrders.length })
    }

    const hasData = (productsRes.count || 0) > 0 || (totalOrdersRes.count || 0) > 0

    return NextResponse.json({
      totalProducts: productsRes.count || 0,
      totalOrders: totalOrdersRes.count || 0,
      totalCustomers: customersRes.count || 0,
      lowStockCount: lowStockRes.count || 0,
      revenueToday,
      ordersToday: todayOrders.length,
      revenueWeek,
      revenueTrend,
      ordersThisWeek,
      ordersTrend,
      dailyRevenue,
      recentOrders,
      hasData,
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
      revenueWeek: 0,
      revenueTrend: 0,
      ordersThisWeek: 0,
      ordersTrend: 0,
      dailyRevenue: [],
      recentOrders: [],
      hasData: false,
      apiError: true
    })
  }
}
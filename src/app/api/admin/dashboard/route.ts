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

    // Use Brazil timezone (UTC-3) for "today" boundaries
    const BRT_OFFSET = -3 * 60 // minutes
    const nowBRT = new Date(now.getTime() + BRT_OFFSET * 60 * 1000)
    const todayStr = nowBRT.toISOString().split('T')[0] // e.g. "2026-06-12" in BRT
    // Start of today in UTC (midnight BRT = 03:00 UTC)
    const todayStartUTC = new Date(todayStr + 'T03:00:00.000Z').toISOString()

    // 7 days ago
    const weekAgo = new Date(now)
    weekAgo.setDate(weekAgo.getDate() - 7)
    const weekAgoStr = weekAgo.toISOString()

    // 14 days ago (for comparison)
    const twoWeeksAgo = new Date(now)
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)
    const twoWeeksAgoStr = twoWeeksAgo.toISOString()

    // Statuses that represent paid/fulfilled orders (count toward revenue)
    const PAID_STATUSES = ['confirmed', 'shipped', 'delivered']

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
      supabase.from('orders').select('total, status').gte('created_at', todayStartUTC),
      supabase.from('orders').select('total, status, created_at').gte('created_at', weekAgoStr),
      supabase.from('orders').select('total, status').gte('created_at', twoWeeksAgoStr).lt('created_at', weekAgoStr),
      supabase.from('orders').select('id, total, status, created_at, shipping_method').order('created_at', { ascending: false }).limit(5),
    ])

    const todayOrders = todayOrdersRes.data || []
    const weekOrders = weekOrdersRes.data || []
    const prevWeekOrders = prevWeekOrdersRes.data || []
    const recentOrders = recentOrdersRes.data || []

    // Revenue = confirmed + shipped + delivered (all paid statuses)
    const revenueToday = todayOrders
      .filter(o => PAID_STATUSES.includes(o.status))
      .reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0)

    const revenueWeek = weekOrders
      .filter(o => PAID_STATUSES.includes(o.status))
      .reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0)

    const revenuePrevWeek = prevWeekOrders
      .filter(o => PAID_STATUSES.includes(o.status))
      .reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0)

    const revenueTrend = revenuePrevWeek > 0
      ? Math.round(((revenueWeek - revenuePrevWeek) / revenuePrevWeek) * 100)
      : revenueWeek > 0 ? 100 : 0

    // Orders count: exclude cancelled (pending = awaiting payment, still valid)
    const ordersThisWeek = weekOrders.filter(o => o.status !== 'cancelled').length
    const ordersPrevWeek = prevWeekOrders.filter(o => o.status !== 'cancelled').length
    const ordersTrend = ordersPrevWeek > 0
      ? Math.round(((ordersThisWeek - ordersPrevWeek) / ordersPrevWeek) * 100)
      : ordersThisWeek > 0 ? 100 : 0

    // Daily breakdown for chart — use BRT date for each order
    const dailyRevenue: { date: string; revenue: number; orders: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(nowBRT)
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      // Convert each order's created_at to BRT date for grouping
      const dayOrders = weekOrders.filter(o => {
        if (!o.created_at) return false
        const orderBRT = new Date(new Date(o.created_at).getTime() + BRT_OFFSET * 60 * 1000)
        return orderBRT.toISOString().split('T')[0] === dateStr
      })
      const dayRevenue = dayOrders
        .filter(o => PAID_STATUSES.includes(o.status))
        .reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0)
      dailyRevenue.push({ date: dateStr, revenue: dayRevenue, orders: dayOrders.filter(o => o.status !== 'cancelled').length })
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
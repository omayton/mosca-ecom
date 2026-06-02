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
    const period = searchParams.get('period') || '30' // days
    const type = searchParams.get('type') || 'summary'

    const supabase = getSupabase()
    const daysAgo = new Date()
    daysAgo.setDate(daysAgo.getDate() - parseInt(period))
    const since = daysAgo.toISOString()

    if (type === 'summary') {
      const [ordersRes, confirmedRes, cancelledRes] = await Promise.all([
        supabase
          .from('orders')
          .select('id, total, status, created_at')
          .gte('created_at', since),
        supabase
          .from('orders')
          .select('total')
          .eq('status', 'confirmed')
          .gte('created_at', since),
        supabase
          .from('orders')
          .select('id')
          .eq('status', 'cancelled')
          .gte('created_at', since),
      ])

      const allOrders = ordersRes.data || []
      const confirmedOrders = confirmedRes.data || []
      const cancelledCount = cancelledRes.data?.length || 0

      const totalRevenue = confirmedOrders.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0)
      const avgTicket = confirmedOrders.length > 0 ? totalRevenue / confirmedOrders.length : 0

      // Daily breakdown
      const dailyMap = new Map<string, { revenue: number; orders: number }>()
      for (const order of allOrders) {
        const day = order.created_at.split('T')[0]
        const entry = dailyMap.get(day) || { revenue: 0, orders: 0 }
        entry.orders++
        if (order.status === 'confirmed') {
          entry.revenue += parseFloat(order.total) || 0
        }
        dailyMap.set(day, entry)
      }

      const daily = Array.from(dailyMap.entries())
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => a.date.localeCompare(b.date))

      return NextResponse.json({
        period: parseInt(period),
        totalOrders: allOrders.length,
        confirmedOrders: confirmedOrders.length,
        cancelledOrders: cancelledCount,
        totalRevenue,
        avgTicket,
        conversionRate: allOrders.length > 0
          ? ((confirmedOrders.length / allOrders.length) * 100).toFixed(1)
          : '0',
        daily,
      })
    }

    if (type === 'top-products') {
      const { data: items } = await supabase
        .from('order_items')
        .select(`
          product_id,
          quantity,
          unit_price,
          orders!inner(status, created_at)
        `)
        .eq('orders.status', 'confirmed')
        .gte('orders.created_at', since)

      const productMap = new Map<number, { quantity: number; revenue: number }>()
      for (const item of items || []) {
        const entry = productMap.get(item.product_id) || { quantity: 0, revenue: 0 }
        entry.quantity += item.quantity
        entry.revenue += item.quantity * (parseFloat(item.unit_price) || 0)
        productMap.set(item.product_id, entry)
      }

      const productIds = Array.from(productMap.keys())
      const { data: products } = await supabase
        .from('products')
        .select('id, name, slug, image_file')
        .in('id', productIds.length > 0 ? productIds : [0])

      const topProducts = Array.from(productMap.entries())
        .map(([id, data]) => {
          const product = products?.find((p: any) => p.id === id)
          return { id, name: product?.name || 'Produto removido', slug: product?.slug, imageFile: product?.image_file, ...data }
        })
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10)

      return NextResponse.json({ topProducts })
    }

    if (type === 'by-category') {
      const { data: items } = await supabase
        .from('order_items')
        .select(`
          quantity,
          unit_price,
          products!inner(category, category_slug),
          orders!inner(status, created_at)
        `)
        .eq('orders.status', 'confirmed')
        .gte('orders.created_at', since)

      const catMap = new Map<string, { name: string; quantity: number; revenue: number }>()
      for (const item of items || []) {
        const cat = (item as any).products?.category || 'Sem categoria'
        const entry = catMap.get(cat) || { name: cat, quantity: 0, revenue: 0 }
        entry.quantity += item.quantity
        entry.revenue += item.quantity * (parseFloat(item.unit_price) || 0)
        catMap.set(cat, entry)
      }

      const byCategory = Array.from(catMap.values())
        .sort((a, b) => b.revenue - a.revenue)

      return NextResponse.json({ byCategory })
    }

    return NextResponse.json({ error: 'Tipo de relatório inválido' }, { status: 400 })
  } catch (error) {
    console.error('Reports error:', error)
    return NextResponse.json({ error: 'Erro ao gerar relatório.' }, { status: 500 })
  }
}

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
    const hoursAgo = parseInt(searchParams.get('hours') || '2')

    const supabase = getSupabase()
    const cutoff = new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString()

    // Get cart_items grouped by user, where first_added_at (or updated_at as fallback) is older than cutoff
    // Note: .lt() skips NULL, so we also grab rows where first_added_at IS NULL
    const { data: cartData, error: cartError } = await supabase
      .from('cart_items')
      .select('user_id, product_id, quantity, first_added_at, updated_at, products(name, price, image_file, slug)')
      .or(`first_added_at.lt.${cutoff},and(first_added_at.is.null,updated_at.lt.${cutoff})`)
      .order('first_added_at', { ascending: false })

    if (cartError) throw cartError
    if (!cartData || cartData.length === 0) {
      return NextResponse.json({ carts: [] })
    }

    // Group by user_id
    const userCarts: Record<string, any[]> = {}
    for (const row of cartData) {
      if (!row.user_id) continue
      if (!userCarts[row.user_id]) userCarts[row.user_id] = []
      userCarts[row.user_id].push(row)
    }

    const userIds = Object.keys(userCarts)
    if (userIds.length === 0) {
      return NextResponse.json({ carts: [] })
    }

    // Get profiles for these users
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name, phone')
      .in('id', userIds)

    // Get emails + names from auth.users via admin API
    const { data: authUsers } = await supabase.auth.admin.listUsers()
    const emailMap: Record<string, string> = {}
    const metaNameMap: Record<string, string> = {}
    if (authUsers?.users) {
      for (const u of authUsers.users) {
        if (u.email) emailMap[u.id] = u.email
        const meta = u.user_metadata || {}
        const name = meta.name || meta.full_name
        if (name) metaNameMap[u.id] = name
      }
    }

    // Get recent orders to exclude users who completed a purchase
    const { data: recentOrders } = await supabase
      .from('orders')
      .select('user_id, created_at')
      .in('user_id', userIds)
      .neq('status', 'cancelled')
      .order('created_at', { ascending: false })

    const usersWithRecentOrder = new Set<string>()
    if (recentOrders) {
      for (const order of recentOrders) {
        const cartItems = userCarts[order.user_id]
        if (cartItems && cartItems.length > 0) {
          const lastCartUpdate = cartItems[0].first_added_at
          if (new Date(order.created_at) > new Date(lastCartUpdate)) {
            usersWithRecentOrder.add(order.user_id)
          }
        }
      }
    }

    // Get notifications already sent (graceful if table doesn't exist)
    let notifMap: Record<string, { whatsapp?: string; email?: string; recovered?: boolean }> = {}
    try {
      const { data: notifications, error: notifError } = await supabase
        .from('abandoned_cart_notifications')
        .select('user_id, channel, sent_at, recovered')
        .in('user_id', userIds)
        .order('sent_at', { ascending: false })

      if (!notifError && notifications) {
        for (const n of notifications) {
          if (!notifMap[n.user_id]) {
            notifMap[n.user_id] = { whatsapp: undefined, email: undefined, recovered: false }
          }
          if (n.channel === 'whatsapp' && !notifMap[n.user_id].whatsapp) {
            notifMap[n.user_id].whatsapp = n.sent_at
          }
          if (n.channel === 'email' && !notifMap[n.user_id].email) {
            notifMap[n.user_id].email = n.sent_at
          }
          if (n.recovered) {
            notifMap[n.user_id].recovered = true
          }
        }
      }
    } catch {
      // Table might not exist yet — continue without notifications
    }

    const profileMap: Record<string, any> = {}
    if (profiles) {
      for (const p of profiles) profileMap[p.id] = p
    }

    // Build response
    const carts = userIds
      .filter((uid) => !usersWithRecentOrder.has(uid))
      .map((userId) => {
        const items = userCarts[userId]
        const profile = profileMap[userId]
        const total = items.reduce((sum: number, i: any) => sum + (i.products?.price || 0) * i.quantity, 0)
        const lastUpdate = items[0]?.first_added_at || items[0]?.updated_at

        return {
          userId,
          name: profile?.name || metaNameMap[userId] || emailMap[userId]?.split('@')[0] || null,
          email: emailMap[userId] || null,
          phone: profile?.phone || null,
          items: items.map((i: any) => ({
            productId: i.product_id,
            name: i.products?.name || '',
            price: i.products?.price || 0,
            quantity: i.quantity,
            imageFile: i.products?.image_file || '',
            slug: i.products?.slug || '',
          })),
          total,
          lastUpdate,
          notifications: notifMap[userId] || {},
          recovered: notifMap[userId]?.recovered || false,
        }
      })
      .sort((a, b) => new Date(a.lastUpdate).getTime() - new Date(b.lastUpdate).getTime())

    return NextResponse.json({ carts })
  } catch (error) {
    console.error('Abandoned carts error:', error)
    return NextResponse.json({ error: 'Erro ao buscar carrinhos abandonados.' }, { status: 500 })
  }
}

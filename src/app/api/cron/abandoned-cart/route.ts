import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { fmt } from '@/lib/products'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Vercel Cron: runs every hour to send abandoned cart notifications
// Configure in vercel.json: { "crons": [{ "path": "/api/cron/abandoned-cart", "schedule": "0 * * * *" }] }
export async function GET(req: NextRequest) {
  // Verify cron secret to prevent unauthorized calls
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = getSupabase()

    // Find carts abandoned for more than 2 hours
    const cutoff = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()

    const { data: cartData, error: cartError } = await supabase
      .from('cart_items')
      .select('user_id, product_id, quantity, updated_at, products(name, price)')
      .lt('updated_at', cutoff)

    if (cartError) throw cartError
    if (!cartData || cartData.length === 0) {
      return NextResponse.json({ message: 'No abandoned carts found', sent: 0 })
    }

    // Group by user_id
    const userCarts: Record<string, any[]> = {}
    for (const row of cartData) {
      if (!row.user_id) continue
      if (!userCarts[row.user_id]) userCarts[row.user_id] = []
      userCarts[row.user_id].push(row)
    }

    const userIds = Object.keys(userCarts)

    // Check who was already notified in the last 24h
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { data: recentNotifs } = await supabase
      .from('abandoned_cart_notifications')
      .select('user_id, channel')
      .in('user_id', userIds)
      .gt('sent_at', oneDayAgo)

    const notifiedUsers: Record<string, Set<string>> = {}
    if (recentNotifs) {
      for (const n of recentNotifs) {
        if (!notifiedUsers[n.user_id]) notifiedUsers[n.user_id] = new Set()
        notifiedUsers[n.user_id].add(n.channel)
      }
    }

    // Check who has recent orders (exclude them)
    const { data: recentOrders } = await supabase
      .from('orders')
      .select('user_id, created_at')
      .in('user_id', userIds)
      .neq('status', 'cancelled')

    const usersWithRecentOrder = new Set<string>()
    if (recentOrders) {
      for (const order of recentOrders) {
        const cartItems = userCarts[order.user_id]
        if (cartItems && cartItems.length > 0) {
          const lastCartUpdate = cartItems[0].updated_at
          if (new Date(order.created_at) > new Date(lastCartUpdate)) {
            usersWithRecentOrder.add(order.user_id)
          }
        }
      }
    }

    // Get profiles and emails
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name, phone')
      .in('id', userIds)

    const profileMap: Record<string, any> = {}
    if (profiles) for (const p of profiles) profileMap[p.id] = p

    const { data: authUsers } = await supabase.auth.admin.listUsers()
    const emailMap: Record<string, string> = {}
    if (authUsers?.users) {
      for (const u of authUsers.users) {
        if (u.email) emailMap[u.id] = u.email
      }
    }

    let sentCount = 0
    const resendKey = process.env.RESEND_API_KEY

    for (const userId of userIds) {
      // Skip if user completed order after cart
      if (usersWithRecentOrder.has(userId)) continue

      const items = userCarts[userId]
      const profile = profileMap[userId]
      const email = emailMap[userId]
      const phone = profile?.phone
      const userName = profile?.name || 'Cliente'
      const total = items.reduce((sum: number, i: any) => sum + (i.products?.price || 0) * i.quantity, 0)
      const itemsList = items.map((i: any) => `${i.quantity}x ${i.products?.name}`).join('\n')

      const snapshot = items.map((i: any) => ({
        productId: i.product_id,
        name: i.products?.name,
        price: i.products?.price,
        quantity: i.quantity,
      }))

      // Send email if not already notified
      if (email && resendKey && !notifiedUsers[userId]?.has('email')) {
        try {
          const itemsHtml = items.map((i: any) =>
            `<tr>
              <td style="padding: 8px; border-bottom: 1px solid #f4f4f5;">${i.products?.name}</td>
              <td style="padding: 8px; border-bottom: 1px solid #f4f4f5; text-align: center;">${i.quantity}</td>
              <td style="padding: 8px; border-bottom: 1px solid #f4f4f5; text-align: right; font-weight: bold;">R$ ${fmt((i.products?.price || 0) * i.quantity)}</td>
            </tr>`
          ).join('')

          const html = `
            <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #18181b; font-size: 24px; margin: 0;">Mosca Branca Parts</h1>
                <p style="color: #71717a; font-size: 14px; margin-top: 4px;">Peças Automotivas Raras</p>
              </div>
              <h2 style="color: #18181b; font-size: 20px;">Olá ${userName}!</h2>
              <p style="color: #52525b; font-size: 15px; line-height: 1.6;">
                Notamos que você deixou alguns itens no carrinho. Eles ainda estão esperando por você!
              </p>
              <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <thead>
                  <tr style="background: #f4f4f5;">
                    <th style="padding: 10px 8px; text-align: left; font-size: 12px; color: #71717a; text-transform: uppercase;">Produto</th>
                    <th style="padding: 10px 8px; text-align: center; font-size: 12px; color: #71717a; text-transform: uppercase;">Qtd</th>
                    <th style="padding: 10px 8px; text-align: right; font-size: 12px; color: #71717a; text-transform: uppercase;">Valor</th>
                  </tr>
                </thead>
                <tbody>${itemsHtml}</tbody>
                <tfoot>
                  <tr>
                    <td colspan="2" style="padding: 12px 8px; font-weight: bold;">Total</td>
                    <td style="padding: 12px 8px; text-align: right; font-weight: bold; font-size: 18px;">R$ ${fmt(total)}</td>
                  </tr>
                </tfoot>
              </table>
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://www.moscabrancaparts.com.br/checkout"
                   style="display: inline-block; background: #18181b; color: white; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 15px;">
                  Finalizar minha compra
                </a>
              </div>
              <p style="color: #a1a1aa; font-size: 12px; text-align: center; margin-top: 40px;">
                Se você já finalizou essa compra, desconsidere este email.<br/>
                Mosca Branca Parts — Peças raras, soluções únicas.
              </p>
            </div>
          `

          const emailRes = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: 'Mosca Branca Parts <noreply@moscabrancaparts.com.br>',
              to: email,
              subject: `${userName}, seus itens ainda estão no carrinho! 🛒`,
              html,
            }),
          })

          if (emailRes.ok) {
            await supabase.from('abandoned_cart_notifications').insert({
              user_id: userId,
              channel: 'email',
              items_snapshot: snapshot,
            })
            sentCount++
          }
        } catch (e) {
          console.error(`Failed to send email to ${userId}:`, e)
        }
      }

      // Record WhatsApp notification (admin will manually send via dashboard link)
      if (phone && !notifiedUsers[userId]?.has('whatsapp')) {
        const cleanPhone = phone.replace(/\D/g, '')
        const fullPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`

        let message = `Olá ${userName}! 👋\n\n`
        message += `Notamos que você deixou alguns itens no carrinho:\n\n`
        message += `${itemsList}\n\n`
        message += `💰 Total: R$ ${fmt(total)}\n\n`
        message += `Finalize sua compra: https://www.moscabrancaparts.com.br/checkout\n\n`
        message += `Alguma dúvida? Estamos aqui para ajudar! 🚗`

        // For WhatsApp, we save the notification and the admin dashboard shows the link
        // Auto-send via WhatsApp Business API could be added later
        await supabase.from('abandoned_cart_notifications').insert({
          user_id: userId,
          channel: 'whatsapp',
          items_snapshot: [...snapshot, { whatsapp_url: `https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}` }],
        })
        sentCount++
      }
    }

    return NextResponse.json({ message: `Notifications processed`, sent: sentCount })
  } catch (error) {
    console.error('Abandoned cart cron error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

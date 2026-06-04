import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { fmt } from '@/lib/products'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Vercel Cron: runs daily at 9am to send abandoned cart notifications
// Configure in vercel.json: { "crons": [{ "path": "/api/cron/abandoned-cart", "schedule": "0 9 * * *" }] }
// Max 3 notifications per user (email + whatsapp), then stops if not recovered
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
      .select('user_id, product_id, quantity, first_added_at, products(name, price)')
      .lt('first_added_at', cutoff)

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

    // Check notification history per user (max 3 notifications per channel, skip if recovered)
    const { data: allNotifs } = await supabase
      .from('abandoned_cart_notifications')
      .select('user_id, channel, sent_at, recovered')
      .in('user_id', userIds)
      .order('sent_at', { ascending: false })

    // Track notification counts per user+channel, and recovered status
    const notifCounts: Record<string, { email: number; whatsapp: number; recovered: boolean }> = {}
    if (allNotifs) {
      for (const n of allNotifs) {
        if (!notifCounts[n.user_id]) {
          notifCounts[n.user_id] = { email: 0, whatsapp: 0, recovered: false }
        }
        // Count only if not recovered yet
        if (!n.recovered) {
          if (n.channel === 'email' && notifCounts[n.user_id].email < 3) {
            notifCounts[n.user_id].email++
          }
          if (n.channel === 'whatsapp' && notifCounts[n.user_id].whatsapp < 3) {
            notifCounts[n.user_id].whatsapp++
          }
        }
        // If any notification was recovered, mark user as recovered
        if (n.recovered) {
          notifCounts[n.user_id].recovered = true
        }
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
          const lastCartUpdate = cartItems[0].first_added_at
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

      // Skip if already recovered
      if (notifCounts[userId]?.recovered) continue

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

      const notifCount = notifCounts[userId] || { email: 0, whatsapp: 0, recovered: false }

      // Send email if under 3 notifications total
      if (email && resendKey && notifCount.email < 3) {
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
      if (phone && notifCount.whatsapp < 3) {
        const cleanPhone = phone.replace(/\D/g, '')
        const fullPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`

        let message = `Olá ${userName}! 👋\n\n`
        message += `Notamos que você deixou alguns itens no carrinho:\n\n`
        message += `${itemsList}\n\n`
        message += `💰 Total: R$ ${fmt(total)}\n\n`
        message += `Finalize sua compra: https://www.moscabrancaparts.com.br/checkout\n\n`
        message += `Alguma dúvida? Estamos aqui para ajudar! 🚗`

        // For WhatsApp, we save the notification with the phone number and message
        // Auto-send via WhatsApp Business API could be added later
        await supabase.from('abandoned_cart_notifications').insert({
          user_id: userId,
          channel: 'whatsapp',
          items_snapshot: {
            items: snapshot,
            phone: fullPhone,
            message
          },
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

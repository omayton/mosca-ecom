import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/require-admin'
import { fmt } from '@/lib/products'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  try {
    const { userId, channel, couponCode } = await req.json()

    if (!userId || !channel) {
      return NextResponse.json({ error: 'userId e channel são obrigatórios' }, { status: 400 })
    }

    const supabase = getSupabase()

    // Get cart items
    const { data: cartItems } = await supabase
      .from('cart_items')
      .select('product_id, quantity, products(name, price)')
      .eq('user_id', userId)

    if (!cartItems || cartItems.length === 0) {
      return NextResponse.json({ error: 'Carrinho vazio ou não encontrado' }, { status: 404 })
    }

    // Get user info
    const { data: profile } = await supabase
      .from('profiles')
      .select('name, phone')
      .eq('id', userId)
      .single()

    const { data: { user: authUser } } = await supabase.auth.admin.getUserById(userId)

    const userName = profile?.name || 'Cliente'
    const phone = profile?.phone
    const email = authUser?.email

    const total = cartItems.reduce((sum: number, i: any) => sum + (i.products?.price || 0) * i.quantity, 0)
    const itemsList = cartItems.map((i: any) => `${i.quantity}x ${i.products?.name}`).join('\n')

    // Save notification record
    const snapshot = cartItems.map((i: any) => ({
      productId: i.product_id,
      name: i.products?.name,
      price: i.products?.price,
      quantity: i.quantity,
    }))

    await supabase.from('abandoned_cart_notifications').insert({
      user_id: userId,
      channel,
      items_snapshot: snapshot,
    })

    if (channel === 'whatsapp') {
      if (!phone) {
        return NextResponse.json({ error: 'Cliente sem telefone cadastrado' }, { status: 400 })
      }

      const cleanPhone = phone.replace(/\D/g, '')
      const fullPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`

      let message = `Olá ${userName}! 👋\n\n`
      message += `Notamos que você deixou alguns itens no carrinho:\n\n`
      message += `${itemsList}\n\n`
      message += `💰 Total: R$ ${fmt(total)}\n\n`
      if (couponCode) {
        message += `🎁 Use o cupom *${couponCode}* para um desconto especial!\n\n`
      }
      message += `Finalize sua compra: https://www.moscabrancaparts.com.br/checkout\n\n`
      message += `Alguma dúvida? Estamos aqui para ajudar! 🚗`

      const whatsappUrl = `https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`

      return NextResponse.json({ success: true, whatsappUrl })
    }

    if (channel === 'email') {
      if (!email) {
        return NextResponse.json({ error: 'Cliente sem email cadastrado' }, { status: 400 })
      }

      const resendKey = process.env.RESEND_API_KEY
      if (!resendKey) {
        return NextResponse.json({ error: 'RESEND_API_KEY não configurada' }, { status: 500 })
      }

      const couponHtml = couponCode
        ? `<div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 16px 0; text-align: center;">
            <p style="margin: 0; font-size: 14px; color: #166534;">Use o cupom abaixo para um desconto especial:</p>
            <p style="margin: 8px 0 0; font-size: 24px; font-weight: bold; color: #15803d; letter-spacing: 2px;">${couponCode}</p>
          </div>`
        : ''

      const itemsHtml = cartItems.map((i: any) =>
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

          ${couponHtml}

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

      if (!emailRes.ok) {
        const errData = await emailRes.json()
        console.error('Resend error:', errData)
        return NextResponse.json({ error: 'Erro ao enviar email. Verifique configuração do Resend.' }, { status: 500 })
      }

      return NextResponse.json({ success: true, message: 'Email enviado com sucesso' })
    }

    return NextResponse.json({ error: 'Canal inválido' }, { status: 400 })
  } catch (error) {
    console.error('Recover error:', error)
    return NextResponse.json({ error: 'Erro ao processar recuperação.' }, { status: 500 })
  }
}

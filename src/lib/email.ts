/**
 * Email service using Resend API.
 *
 * Setup:
 * 1. Create account at resend.com
 * 2. Add and verify your domain
 * 3. Set RESEND_API_KEY env var in Vercel
 * 4. Set EMAIL_FROM env var (e.g., "Mosca Branca Parts <noreply@moscabrancaparts.com.br>")
 */

const RESEND_API_URL = "https://api.resend.com/emails"

interface SendEmailParams {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: SendEmailParams): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY not configured — email not sent")
    return false
  }

  const from = process.env.EMAIL_FROM || "Mosca Branca Parts <noreply@moscabrancaparts.com.br>"

  try {
    const res = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ from, to, subject, html }),
    })

    if (!res.ok) {
      const error = await res.text()
      console.error("[email] Failed to send:", error)
      return false
    }

    return true
  } catch (err: any) {
    console.error("[email] Error:", err.message)
    return false
  }
}

/** Format price in BRL */
function fmtPrice(n: number): string {
  return n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// ─── Email Templates ────────────────────────────────────────────────────────

interface OrderEmailData {
  customerName: string
  orderId: number
  items: { name: string; quantity: number; price: number }[]
  total: number
  shippingMethod?: string
  shippingCost?: number
}

function baseTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:32px 16px;">
    <div style="background:#18181b;padding:24px;border-radius:12px 12px 0 0;text-align:center;">
      <h1 style="color:#fff;font-size:20px;margin:0;font-weight:700;">Mosca Branca Parts</h1>
      <p style="color:#a1a1aa;font-size:12px;margin:4px 0 0;">Peças raras, soluções únicas</p>
    </div>
    <div style="background:#fff;padding:32px 24px;border-radius:0 0 12px 12px;border:1px solid #e4e4e7;border-top:none;">
      ${content}
    </div>
    <div style="text-align:center;padding:16px;color:#71717a;font-size:11px;">
      <p>Mosca Branca Parts — moscabrancaparts.com.br</p>
      <p>WhatsApp: (34) 99936-5936</p>
    </div>
  </div>
</body>
</html>`
}

export function orderConfirmedEmail(data: OrderEmailData): { subject: string; html: string } {
  const itemsHtml = data.items.map((item) => `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #f4f4f5;font-size:14px;color:#27272a;">${item.name}</td>
      <td style="padding:8px 0;border-bottom:1px solid #f4f4f5;font-size:14px;color:#52525b;text-align:center;">${item.quantity}</td>
      <td style="padding:8px 0;border-bottom:1px solid #f4f4f5;font-size:14px;color:#27272a;text-align:right;font-weight:600;">R$ ${fmtPrice(item.price * item.quantity)}</td>
    </tr>
  `).join("")

  const content = `
    <h2 style="color:#18181b;font-size:18px;margin:0 0 8px;">Pedido confirmado!</h2>
    <p style="color:#52525b;font-size:14px;margin:0 0 24px;">
      Olá ${data.customerName}, seu pedido <strong>#${data.orderId}</strong> foi recebido com sucesso.
    </p>
    <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
      <thead>
        <tr style="border-bottom:2px solid #e4e4e7;">
          <th style="text-align:left;padding:8px 0;font-size:12px;color:#71717a;text-transform:uppercase;">Produto</th>
          <th style="text-align:center;padding:8px 0;font-size:12px;color:#71717a;text-transform:uppercase;">Qtd</th>
          <th style="text-align:right;padding:8px 0;font-size:12px;color:#71717a;text-transform:uppercase;">Valor</th>
        </tr>
      </thead>
      <tbody>${itemsHtml}</tbody>
    </table>
    ${data.shippingCost ? `<p style="font-size:14px;color:#52525b;margin:8px 0;">Frete (${data.shippingMethod || 'Padrão'}): <strong>R$ ${fmtPrice(data.shippingCost)}</strong></p>` : ''}
    <p style="font-size:16px;color:#18181b;font-weight:700;margin:16px 0;padding-top:12px;border-top:2px solid #e4e4e7;">
      Total: R$ ${fmtPrice(data.total)}
    </p>
    <p style="color:#52525b;font-size:14px;">Você receberá atualizações sobre o status do seu pedido por email.</p>
    <a href="https://www.moscabrancaparts.com.br/minha-conta/pedidos" style="display:inline-block;margin-top:16px;background:#dc2626;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;">
      Acompanhar pedido
    </a>
  `

  return {
    subject: `Pedido #${data.orderId} confirmado — Mosca Branca Parts`,
    html: baseTemplate(content),
  }
}

export function paymentApprovedEmail(data: { customerName: string; orderId: number }): { subject: string; html: string } {
  const content = `
    <h2 style="color:#18181b;font-size:18px;margin:0 0 8px;">Pagamento aprovado! ✓</h2>
    <p style="color:#52525b;font-size:14px;margin:0 0 16px;">
      Olá ${data.customerName}, o pagamento do pedido <strong>#${data.orderId}</strong> foi aprovado.
    </p>
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin:16px 0;">
      <p style="color:#166534;font-size:14px;margin:0;font-weight:600;">Seu pedido está sendo preparado para envio.</p>
    </div>
    <p style="color:#52525b;font-size:14px;">Assim que for despachado, enviaremos o código de rastreamento.</p>
    <a href="https://www.moscabrancaparts.com.br/minha-conta/pedidos" style="display:inline-block;margin-top:16px;background:#dc2626;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;">
      Ver meus pedidos
    </a>
  `

  return {
    subject: `Pagamento aprovado — Pedido #${data.orderId}`,
    html: baseTemplate(content),
  }
}

export function paymentRejectedEmail(data: { customerName: string; orderId: number }): { subject: string; html: string } {
  const content = `
    <h2 style="color:#18181b;font-size:18px;margin:0 0 8px;">Pagamento não aprovado</h2>
    <p style="color:#52525b;font-size:14px;margin:0 0 16px;">
      Olá ${data.customerName}, infelizmente o pagamento do pedido <strong>#${data.orderId}</strong> não foi aprovado.
    </p>
    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;margin:16px 0;">
      <p style="color:#991b1b;font-size:14px;margin:0;">Isso pode acontecer por limite insuficiente, dados incorretos ou bloqueio do banco.</p>
    </div>
    <p style="color:#52525b;font-size:14px;">Você pode tentar novamente com outro método de pagamento ou entrar em contato conosco.</p>
    <a href="https://wa.me/5534999365936" style="display:inline-block;margin-top:16px;background:#16a34a;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;">
      Falar no WhatsApp
    </a>
  `

  return {
    subject: `Pagamento não aprovado — Pedido #${data.orderId}`,
    html: baseTemplate(content),
  }
}

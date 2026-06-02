import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"
import { createCardPayment, createPixPayment } from "@/lib/mercadopago"
import { rateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit"

function getAdminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

async function logPayment(data: {
  orderId: number
  userId: string
  paymentMethod: string
  status: string
  amount: number
  gatewayId?: string
  gatewayResponse?: any
  errorMessage?: string
  ip: string
}) {
  try {
    const supabase = getAdminSupabase()
    await supabase.from("payment_logs").insert({
      order_id: data.orderId,
      user_id: data.userId,
      payment_method: data.paymentMethod,
      status: data.status,
      amount: data.amount,
      gateway_id: data.gatewayId || null,
      gateway_response: data.gatewayResponse || {},
      error_message: data.errorMessage || null,
      ip_address: data.ip,
    })
  } catch (err: any) {
    console.error("[payment_log] failed to log:", err.message)
  }
}

function getAuthClient() {
  const cookieStore = cookies()
  const accessToken = cookieStore.get("sb-access-token")?.value
  if (!accessToken) return null

  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
      auth: { persistSession: false },
    }
  )
  return { client, accessToken }
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers)
  const { success } = rateLimit(`payment:${ip}`, RATE_LIMITS.checkout)
  if (!success) {
    return NextResponse.json({ error: "Muitas tentativas. Aguarde um momento." }, { status: 429 })
  }

  const auth = getAuthClient()
  if (!auth) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  const { data: { user } } = await auth.client.auth.getUser(auth.accessToken)
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  const body = await req.json()
  const { orderId, paymentMethod, token, installments, issuerId, paymentMethodId } = body

  if (!orderId || !paymentMethod) {
    return NextResponse.json({ error: "Dados incompletos" }, { status: 400 })
  }

  // Buscar pedido e validar ownership
  const { data: order, error: orderErr } = await auth.client
    .from("orders")
    .select("id, total, cpf, user_id, status")
    .eq("id", orderId)
    .single()

  if (orderErr || !order) {
    return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 })
  }

  if (order.user_id !== user.id) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
  }

  if (order.status !== "pending") {
    return NextResponse.json({ error: "Pedido já processado" }, { status: 400 })
  }

  const payer = {
    email: user.email!,
    identification: { type: "CPF", number: order.cpf?.replace(/\D/g, "") || "" },
    first_name: user.user_metadata?.name || undefined,
  }

  try {
    let payment: any

    if (paymentMethod === "pix") {
      payment = await createPixPayment({
        orderId: order.id,
        transactionAmount: Number(order.total),
        description: `Pedido #${order.id} — Mosca Branca Parts`,
        payer,
      })

      // Atualizar pedido com payment_id
      await auth.client
        .from("orders")
        .update({
          payment_id: String(payment.id),
          payment_method: "pix",
          updated_at: new Date().toISOString(),
        })
        .eq("id", order.id)

      await logPayment({
        orderId: order.id, userId: user.id, paymentMethod: "pix",
        status: payment.status, amount: Number(order.total),
        gatewayId: String(payment.id), gatewayResponse: { status: payment.status }, ip,
      })

      return NextResponse.json({
        status: payment.status,
        qr_code: payment.point_of_interaction?.transaction_data?.qr_code || "",
        qr_code_base64: payment.point_of_interaction?.transaction_data?.qr_code_base64 || "",
        ticket_url: payment.point_of_interaction?.transaction_data?.ticket_url || "",
        expiration: payment.date_of_expiration || "",
      })
    }

    if (paymentMethod === "credit_card") {
      if (!token || !installments || !paymentMethodId) {
        return NextResponse.json({ error: "Dados do cartão incompletos" }, { status: 400 })
      }

      payment = await createCardPayment({
        orderId: order.id,
        transactionAmount: Number(order.total),
        description: `Pedido #${order.id} — Mosca Branca Parts`,
        token,
        installments: Number(installments),
        issuerId: issuerId || undefined,
        paymentMethodId,
        payer,
      })

      // Mapear status
      let orderStatus = "pending"
      if (payment.status === "approved") orderStatus = "confirmed"
      if (payment.status === "rejected") orderStatus = "cancelled"

      await auth.client
        .from("orders")
        .update({
          payment_id: String(payment.id),
          payment_method: paymentMethodId,
          status: orderStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", order.id)

      await logPayment({
        orderId: order.id, userId: user.id, paymentMethod: "credit_card",
        status: payment.status, amount: Number(order.total),
        gatewayId: String(payment.id),
        gatewayResponse: { status: payment.status, status_detail: payment.status_detail },
        ip,
      })

      return NextResponse.json({
        status: payment.status,
        status_detail: payment.status_detail || "",
      })
    }

    return NextResponse.json({ error: "Método de pagamento inválido" }, { status: 400 })
  } catch (err: any) {
    console.error("[payments] error:", err.message)
    await logPayment({
      orderId: orderId, userId: user.id, paymentMethod: paymentMethod || "unknown",
      status: "error", amount: Number(order?.total || 0),
      errorMessage: err.message, ip,
    })
    return NextResponse.json(
      { error: "Erro ao processar pagamento. Tente novamente." },
      { status: 502 }
    )
  }
}

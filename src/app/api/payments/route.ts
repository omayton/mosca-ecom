import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"
import { createCardPayment, createPixPayment } from "@/lib/mercadopago"

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

      return NextResponse.json({
        status: payment.status,
        status_detail: payment.status_detail || "",
      })
    }

    return NextResponse.json({ error: "Método de pagamento inválido" }, { status: 400 })
  } catch (err: any) {
    console.error("[payments] error:", err.message)
    return NextResponse.json(
      { error: "Erro ao processar pagamento. Tente novamente." },
      { status: 502 }
    )
  }
}

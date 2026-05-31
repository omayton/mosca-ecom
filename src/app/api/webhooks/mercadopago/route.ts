import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getPayment } from "@/lib/mercadopago"

export async function POST(req: NextRequest) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  try {
    const body = await req.json()

    if (body.type !== "payment") {
      return NextResponse.json({ ok: true })
    }

    const paymentId = body.data?.id
    if (!paymentId) {
      return NextResponse.json({ ok: true })
    }

    const payment = await getPayment(String(paymentId))

    const orderId = payment.external_reference
    if (!orderId) {
      console.error("[webhook] payment without external_reference:", paymentId)
      return NextResponse.json({ ok: true })
    }

    let newStatus: string
    switch (payment.status) {
      case "approved":
        newStatus = "confirmed"
        break
      case "rejected":
      case "cancelled":
      case "refunded":
      case "charged_back":
        newStatus = "cancelled"
        break
      default:
        newStatus = "pending"
    }

    await supabaseAdmin
      .from("orders")
      .update({
        status: newStatus,
        payment_id: String(paymentId),
        payment_method: payment.payment_type_id || payment.payment_method_id || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", Number(orderId))

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error("[webhook] error:", err.message)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}

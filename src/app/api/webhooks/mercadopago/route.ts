import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getPayment } from "@/lib/mercadopago"
import { createHmac } from "crypto"
import { sendEmail, paymentApprovedEmail, paymentRejectedEmail } from "@/lib/email"

/**
 * Validates MercadoPago webhook signature.
 * MercadoPago sends x-signature header with format: "ts=TIMESTAMP,v1=HASH"
 * The HASH is HMAC-SHA256 of "id:{data.id};request-id:{x-request-id};ts:{ts};"
 * signed with the webhook secret.
 */
function validateSignature(req: NextRequest, body: any): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET
  if (!secret) {
    // If no secret configured, log warning but allow (graceful degradation)
    console.warn("[webhook] MERCADOPAGO_WEBHOOK_SECRET not configured — skipping signature validation")
    return true
  }

  const xSignature = req.headers.get("x-signature")
  const xRequestId = req.headers.get("x-request-id")

  if (!xSignature || !xRequestId) return false

  // Parse ts and v1 from x-signature
  const parts = Object.fromEntries(
    xSignature.split(",").map((p) => {
      const [key, ...val] = p.split("=")
      return [key.trim(), val.join("=").trim()]
    })
  )

  const ts = parts.ts
  const expectedHash = parts.v1
  if (!ts || !expectedHash) return false

  // Build the manifest string
  const dataId = body.data?.id
  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`

  // Compute HMAC
  const hmac = createHmac("sha256", secret).update(manifest).digest("hex")

  return hmac === expectedHash
}

export async function POST(req: NextRequest) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  try {
    const body = await req.json()

    // Validate webhook signature
    if (!validateSignature(req, body)) {
      console.error("[webhook] Invalid signature — possible forgery attempt")
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    if (body.type !== "payment") {
      return NextResponse.json({ ok: true })
    }

    const paymentId = body.data?.id
    if (!paymentId) {
      return NextResponse.json({ ok: true })
    }

    let payment: any
    try {
      payment = await getPayment(String(paymentId))
    } catch (fetchErr: any) {
      // Payment not found (e.g. test simulation with fake ID) — ignore gracefully
      console.warn("[webhook] payment not found or MP error:", fetchErr.message)
      return NextResponse.json({ ok: true })
    }

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

    // Send email notification
    try {
      const { data: order } = await supabaseAdmin
        .from("orders")
        .select("user_id")
        .eq("id", Number(orderId))
        .single()

      if (order?.user_id) {
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("full_name, email")
          .eq("id", order.user_id)
          .single()

        // Fallback: get email from auth.users if not in profiles
        let email = profile?.email
        if (!email) {
          const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(order.user_id)
          email = authUser?.user?.email
        }

        if (email) {
          const name = profile?.full_name || "Cliente"
          if (newStatus === "confirmed") {
            const tpl = paymentApprovedEmail({ customerName: name, orderId: Number(orderId) })
            await sendEmail({ to: email, ...tpl })
          } else if (newStatus === "cancelled" && payment.status === "rejected") {
            const tpl = paymentRejectedEmail({ customerName: name, orderId: Number(orderId) })
            await sendEmail({ to: email, ...tpl })
          }
        }
      }
    } catch (emailErr: any) {
      console.error("[webhook] email notification error:", emailErr.message)
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error("[webhook] error:", err.message)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}

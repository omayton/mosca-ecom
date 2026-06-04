import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"
import { rateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit"
import { sendEmail, orderConfirmedEmail } from "@/lib/email"

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
  const { success } = rateLimit(`checkout:${ip}`, RATE_LIMITS.checkout)
  if (!success) {
    return NextResponse.json({ error: "Muitas tentativas. Aguarde um momento." }, { status: 429 })
  }

  const auth = getAuthClient()
  if (!auth) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  const { data: { user } } = await auth.client.auth.getUser(auth.accessToken)
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  const body = await req.json()
  const { items, address, shipping, cpf, saveAddress, idempotencyKey } = body

  if (!items?.length || !address || !shipping || !cpf) {
    return NextResponse.json({ error: "Dados incompletos" }, { status: 400 })
  }

  // Idempotency check: prevent duplicate orders
  if (idempotencyKey) {
    const { data: existingOrder } = await auth.client
      .from("orders")
      .select("id")
      .eq("idempotency_key", idempotencyKey)
      .eq("user_id", user.id)
      .single()

    if (existingOrder) {
      return NextResponse.json({ orderId: existingOrder.id, total: 0, duplicate: true })
    }
  }

  const productIds = items.map((i: any) => i.productId)
  const { data: products, error: prodErr } = await auth.client
    .from("products")
    .select("id, name, price, in_stock")
    .in("id", productIds)

  if (prodErr || !products) {
    return NextResponse.json({ error: "Erro ao validar produtos" }, { status: 500 })
  }

  const productMap = new Map(products.map((p: any) => [p.id, p]))

  let subtotal = 0
  const orderItems: { product_id: number; quantity: number; unit_price: number }[] = []

  for (const item of items) {
    const product = productMap.get(item.productId)
    if (!product) {
      return NextResponse.json({ error: `Produto ${item.productId} não encontrado` }, { status: 400 })
    }
    if (!product.in_stock) {
      return NextResponse.json({ error: `"${product.name}" está fora de estoque` }, { status: 400 })
    }
    const unitPrice = Number(product.price)
    subtotal += unitPrice * item.quantity
    orderItems.push({
      product_id: item.productId,
      quantity: item.quantity,
      unit_price: unitPrice,
    })
  }

  const shippingCost = Number(shipping.price)
  const total = subtotal + shippingCost

  const { data: order, error: orderErr } = await auth.client
    .from("orders")
    .insert({
      user_id: user.id,
      status: "pending",
      total,
      shipping_cost: shippingCost,
      shipping_method: `${shipping.company} - ${shipping.name}`,
      address_json: address,
      cpf,
      ...(idempotencyKey && { idempotency_key: idempotencyKey }),
    })
    .select("id")
    .single()

  if (orderErr || !order) {
    console.error("[checkout] order insert error:", orderErr)
    return NextResponse.json({ error: "Erro ao criar pedido" }, { status: 500 })
  }

  const { error: itemsErr } = await auth.client
    .from("order_items")
    .insert(
      orderItems.map((oi) => ({
        order_id: order.id,
        product_id: oi.product_id,
        quantity: oi.quantity,
        unit_price: oi.unit_price,
      }))
    )

  if (itemsErr) {
    console.error("[checkout] order_items insert error:", itemsErr)
    return NextResponse.json({ error: "Erro ao salvar itens do pedido" }, { status: 500 })
  }

  if (saveAddress) {
    await auth.client
      .from("profiles")
      .update({
        address_json: {
          cep: address.cep,
          logradouro: address.logradouro,
          numero: address.numero,
          complemento: address.complemento,
          bairro: address.bairro,
          cidade: address.cidade,
          estado: address.estado,
        },
        phone: address.telefone,
      })
      .eq("id", user.id)
  }

  // Mark abandoned cart notifications as recovered (non-blocking)
  try {
    const { error: recoveredErr } = await auth.client
      .from("abandoned_cart_notifications")
      .update({ recovered: true })
      .eq("user_id", user.id)
      .eq("recovered", false)
    if (recoveredErr) {
      console.error("[checkout] failed to mark notifications as recovered:", recoveredErr)
    }
  } catch (recoveredErr: any) {
    console.error("[checkout] error marking recovered:", recoveredErr?.message || recoveredErr)
  }

  // Send order confirmation email (non-blocking)
  try {
    const customerName = user.user_metadata?.name || "Cliente"
    const emailItems = items.map((item: any) => {
      const product = productMap.get(item.productId)
      return { name: product?.name || "Produto", quantity: item.quantity, price: Number(product?.price || 0) }
    })
    const tpl = orderConfirmedEmail({
      customerName,
      orderId: order.id,
      items: emailItems,
      total,
      shippingMethod: `${shipping.company} - ${shipping.name}`,
      shippingCost,
    })
    await sendEmail({ to: user.email!, ...tpl })
  } catch (emailErr: any) {
    console.error("[checkout] email error:", emailErr.message)
  }

  return NextResponse.json({ orderId: order.id, total })
}

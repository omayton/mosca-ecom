import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"

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
  const { items, address, shipping, cpf, saveAddress } = body

  if (!items?.length || !address || !shipping || !cpf) {
    return NextResponse.json({ error: "Dados incompletos" }, { status: 400 })
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

  return NextResponse.json({ orderId: order.id, total })
}

import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { cep, weight, width, height, length, price } = await req.json()

    const cleanCep = cep?.replace(/\D/g, "")

    if (!cleanCep || cleanCep.length !== 8) {
      return NextResponse.json({ error: "CEP inválido. Digite um CEP com 8 dígitos." }, { status: 400 })
    }

    const token = process.env.MELHOR_ENVIO_TOKEN
    const from = process.env.MELHOR_ENVIO_CEP_ORIGEM

    if (!token || !from) {
      console.error("Missing env: MELHOR_ENVIO_TOKEN or MELHOR_ENVIO_CEP_ORIGEM")
      return NextResponse.json({ error: "Serviço de frete não configurado." }, { status: 500 })
    }

    // Don't allow same origin/destination
    if (cleanCep === from) {
      return NextResponse.json({ error: "Digite um CEP de destino diferente da origem." }, { status: 400 })
    }

    const body = {
      from: { postal_code: from },
      to: { postal_code: cleanCep },
      services: null,
      options: {
        receipt: false,
        own_hand: false,
        insurance_value: price || 0,
      },
      products: [
        {
          id: "1",
          width: Math.max(1, width || 16),
          height: Math.max(1, height || 10),
          length: Math.max(1, length || 10),
          weight: Math.max(0.01, weight || 0.3),
          insurance_value: price || 0,
          quantity: 1,
        },
      ],
    }

    const apiUrl =
      process.env.NODE_ENV === "production"
        ? "https://melhorenvio.com.br/api/v2/me/shipment/calculate"
        : "https://sandbox.melhorenvio.com.br/api/v2/me/shipment/calculate"

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)

    const res = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "User-Agent": "mosca-branca-ecom/1.0",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })

    clearTimeout(timeout)

    const resText = await res.text()

    if (!res.ok) {
      console.error("Melhor Envio API error:", {
        status: res.status,
        statusText: res.statusText,
        body: resText.slice(0, 500),
      })
      return NextResponse.json(
        {
          error: "Não foi possível calcular o frete. Tente novamente em instantes.",
          details: resText.slice(0, 200),
        },
        { status: 502 }
      )
    }

    let data
    try {
      data = JSON.parse(resText)
    } catch {
      console.error("Failed to parse Melhor Envio response:", resText.slice(0, 200))
      return NextResponse.json({ error: "Resposta inválida do serviço de frete." }, { status: 502 })
    }

    // Handle both array and object responses
    const results = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : []

    const options = results
      .filter((s: any) => s.price && parseFloat(s.price) > 0 && !s.error)
      .map((s: any) => ({
        id: s.id,
        name: s.name || s.method,
        company: s.company?.name || s.company || "",
        price: parseFloat(s.price),
        delivery_time: s.delivery_time || s.delivery_range?.max || 0,
      }))
      .sort((a: any, b: any) => a.price - b.price)

    if (options.length === 0) {
      return NextResponse.json({ error: "Nenhuma opção de entrega disponível para este CEP." }, { status: 404 })
    }

    return NextResponse.json(options)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error("Shipping calculate error:", message)

    if (message.includes("abort") || message.includes("timeout")) {
      return NextResponse.json({ error: "O serviço de frete demorou para responder. Tente novamente." }, { status: 504 })
    }

    return NextResponse.json({ error: "Erro ao calcular frete. Tente novamente." }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const { cep, weight, width, height, length } = await req.json()

  if (!cep || cep.replace(/\D/g, "").length !== 8) {
    return NextResponse.json({ error: "CEP inválido" }, { status: 400 })
  }

  const token = process.env.MELHOR_ENVIO_TOKEN
  const from = process.env.MELHOR_ENVIO_CEP_ORIGEM

  if (!token || !from) {
    return NextResponse.json({ error: "Configuração de frete ausente" }, { status: 500 })
  }

  const body = {
    from: { postal_code: from },
    to: { postal_code: cep.replace(/\D/g, "") },
    products: [
      {
        id: "1",
        width: width || 16,
        height: height || 10,
        length: length || 10,
        weight: weight || 0.3,
        insurance_value: 0,
        quantity: 1,
      },
    ],
  }

  const apiUrl = process.env.NODE_ENV === 'production'
    ? 'https://melhorenvio.com.br/api/v2/me/shipment/calculate'
    : 'https://sandbox.melhorenvio.com.br/api/v2/me/shipment/calculate'

  console.log('Using API URL:', apiUrl)

  const res = await fetch(apiUrl, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "User-Agent": "mosca-branca-ecom",
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const errorText = await res.text()
    console.error("Melhor Envio API error:", {
      status: res.status,
      statusText: res.statusText,
      body: errorText,
      requestBody: body,
    })
    return NextResponse.json(
      { error: "Erro ao consultar frete", details: errorText },
      { status: 502 }
    )
  }

  const data = await res.json()

  const options = Array.isArray(data)
    ? data
        .filter((s: any) => s.price && !s.error)
        .map((s: any) => ({
          id: s.id,
          name: s.name,
          company: s.company?.name || "",
          price: parseFloat(s.price),
          delivery_time: s.delivery_time,
        }))
    : []

  return NextResponse.json(options)
}

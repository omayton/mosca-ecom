import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const { cep } = await req.json()

  const token = process.env.MELHOR_ENVIO_TOKEN
  const from = process.env.MELHOR_ENVIO_CEP_ORIGEM

  const cleanCep = cep?.replace(/\D/g, "")

  // Test 1: Simplest possible request
  const body = {
    from: { postal_code: from },
    to: { postal_code: cleanCep || "01001000" },
    products: [
      {
        id: "1",
        width: 16,
        height: 10,
        length: 10,
        weight: 0.3,
        insurance_value: 0,
        quantity: 1,
      },
    ],
  }

  // Try production URL
  try {
    const res = await fetch("https://melhorenvio.com.br/api/v2/me/shipment/calculate", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "User-Agent": "mosca-branca-ecom/1.0",
      },
      body: JSON.stringify(body),
    })

    const text = await res.text()

    return NextResponse.json({
      url: "https://melhorenvio.com.br/api/v2/me/shipment/calculate",
      status: res.status,
      statusText: res.statusText,
      requestBody: body,
      responseBody: text.slice(0, 2000),
      tokenPrefix: token?.slice(0, 20) + "...",
      fromCep: from,
      toCep: cleanCep,
      nodeEnv: process.env.NODE_ENV,
    })
  } catch (err: unknown) {
    return NextResponse.json({
      error: String(err),
      message: err instanceof Error ? err.message : "Unknown error",
      stack: err instanceof Error ? err.stack : undefined,
    })
  }
}

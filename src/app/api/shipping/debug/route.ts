import { NextResponse } from "next/server"

export async function GET() {
  const token = process.env.MELHOR_ENVIO_TOKEN
  const from = process.env.MELHOR_ENVIO_CEP_ORIGEM

  const body = {
    from: { postal_code: from },
    to: { postal_code: "01001000" },
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

  // Try production URL first
  let prodResult
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
    prodResult = {
      url: "PRODUCTION: https://melhorenvio.com.br/api/v2/me/shipment/calculate",
      status: res.status,
      statusText: res.statusText,
      body: (await res.text()).slice(0, 2000),
    }
  } catch (err) {
    prodResult = { error: String(err), message: err instanceof Error ? err.message : "?" }
  }

  // Try sandbox URL
  let sandboxResult
  try {
    const res = await fetch("https://sandbox.melhorenvio.com.br/api/v2/me/shipment/calculate", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "User-Agent": "mosca-branca-ecom/1.0",
      },
      body: JSON.stringify(body),
    })
    sandboxResult = {
      url: "SANDBOX: https://sandbox.melhorenvio.com.br/api/v2/me/shipment/calculate",
      status: res.status,
      statusText: res.statusText,
      body: (await res.text()).slice(0, 2000),
    }
  } catch (err) {
    sandboxResult = { error: String(err), message: err instanceof Error ? err.message : "?" }
  }

  return NextResponse.json({
    env: process.env.NODE_ENV,
    tokenExists: !!token,
    tokenPrefix: token?.slice(0, 30) + "...",
    tokenLength: token?.length,
    fromCep: from,
    toCep: "01001000 (São Paulo - teste)",
    requestBody: body,
    production: prodResult,
    sandbox: sandboxResult,
    timestamp: new Date().toISOString(),
  })
}

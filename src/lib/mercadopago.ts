const MP_API = "https://api.mercadopago.com"

function getToken() {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN
  if (!token) throw new Error("MERCADOPAGO_ACCESS_TOKEN não configurado")
  return token
}

interface CardPaymentParams {
  orderId: number
  transactionAmount: number
  description: string
  token: string
  installments: number
  issuerId?: string
  paymentMethodId: string
  payer: {
    email: string
    identification: { type: string; number: string }
    first_name?: string
  }
}

export async function createCardPayment(params: CardPaymentParams) {
  const body = {
    transaction_amount: params.transactionAmount,
    description: params.description,
    token: params.token,
    installments: params.installments,
    issuer_id: params.issuerId || undefined,
    payment_method_id: params.paymentMethodId,
    payer: params.payer,
    external_reference: String(params.orderId),
    notification_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/webhooks/mercadopago`,
  }

  const res = await fetch(`${MP_API}/v1/payments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
      "X-Idempotency-Key": `order-${params.orderId}-${Date.now()}`,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`MercadoPago createCardPayment failed (${res.status}): ${text}`)
  }

  return res.json()
}

interface PixPaymentParams {
  orderId: number
  transactionAmount: number
  description: string
  payer: {
    email: string
    identification: { type: string; number: string }
    first_name?: string
  }
}

export async function createPixPayment(params: PixPaymentParams) {
  const body = {
    transaction_amount: params.transactionAmount,
    description: params.description,
    payment_method_id: "pix",
    payer: params.payer,
    external_reference: String(params.orderId),
    notification_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/webhooks/mercadopago`,
  }

  const res = await fetch(`${MP_API}/v1/payments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
      "X-Idempotency-Key": `order-pix-${params.orderId}-${Date.now()}`,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`MercadoPago createPixPayment failed (${res.status}): ${text}`)
  }

  return res.json()
}

export async function getPayment(paymentId: string) {
  const res = await fetch(`${MP_API}/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`MercadoPago getPayment failed (${res.status}): ${text}`)
  }

  return res.json()
}


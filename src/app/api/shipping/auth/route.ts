import { NextResponse } from "next/server"

const CLIENT_ID = process.env.MELHOR_ENVIO_CLIENT_ID || "25510"
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_SITE_URL || ""}/api/shipping/callback`

export async function GET() {
  // Melhor Envio OAuth authorization URL
  const params = new URLSearchParams({
    response_type: "code",
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    scope: "shipping-calculate shipping-preview shipping-companies shipping-print shipping-share shipping-tracking ecommerce-shipping",
  })

  const authUrl = `https://melhorenvio.com.br/oauth/authorize?${params.toString()}`

  return NextResponse.redirect(authUrl)
}

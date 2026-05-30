import { NextRequest, NextResponse } from "next/server"

const CLIENT_ID = process.env.MELHOR_ENVIO_CLIENT_ID || "25510"

function getRedirectUri(req: NextRequest) {
  // Build redirect URI from the actual request URL (works on any domain)
  const url = new URL(req.url)
  return `${url.origin}/api/shipping/callback`
}

export async function GET(req: NextRequest) {
  const redirectUri = getRedirectUri(req)

  // Melhor Envio OAuth authorization URL — PRODUCTION (app registered there)
  const params = new URLSearchParams({
    response_type: "code",
    client_id: CLIENT_ID,
    redirect_uri: redirectUri,
    scope: "shipping-calculate shipping-preview shipping-companies shipping-print shipping-share shipping-tracking ecommerce-shipping",
  })

  const authUrl = `https://melhorenvio.com.br/oauth/authorize?${params.toString()}`

  return NextResponse.redirect(authUrl)
}

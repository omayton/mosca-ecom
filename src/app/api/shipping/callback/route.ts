import { NextRequest, NextResponse } from "next/server"

const CLIENT_ID = process.env.MELHOR_ENVIO_CLIENT_ID || "25510"
const CLIENT_SECRET = process.env.MELHOR_ENVIO_CLIENT_SECRET || ""

function getRedirectUri(req: NextRequest) {
  const url = new URL(req.url)
  return `${url.origin}/api/shipping/callback`
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code")
  const error = req.nextUrl.searchParams.get("error")

  if (error) {
    return new Response(`
      <html>
        <head><title>Erro na Autorização</title></head>
        <body style="font-family:system-ui;max-width:600px;margin:40px auto;padding:20px">
          <h1 style="color:#DC2626">❌ Erro na autorização</h1>
          <p>Erro: ${error}</p>
          <p><a href="/">Voltar ao site</a></p>
        </body>
      </html>
    `, { headers: { "Content-Type": "text/html" } })
  }

  if (!code) {
    return new Response(`
      <html>
        <head><title>Código não encontrado</title></head>
        <body style="font-family:system-ui;max-width:600px;margin:40px auto;padding:20px">
          <h1>⚠️ Código de autorização não encontrado</h1>
          <p><a href="/api/shipping/auth">Tentar novamente</a></p>
        </body>
      </html>
    `, { headers: { "Content-Type": "text/html" } })
  }

  // Exchange authorization code for access_token + refresh_token
  try {
    const redirectUri = getRedirectUri(req)

    // Melhor Envio OAuth token endpoint requires form-urlencoded (not JSON)
    const params = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: redirectUri,
      code,
    })

    const tokenRes = await fetch("https://melhorenvio.com.br/oauth/token", {
      method: "POST",
      headers: { "Accept": "application/json", "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    })

    const tokenData = await tokenRes.json()

    if (!tokenRes.ok || !tokenData.access_token) {
      return new Response(`
        <html>
          <head><title>Erro ao obter Token</title></head>
          <body style="font-family:system-ui;max-width:700px;margin:40px auto;padding:20px">
            <h1 style="color:#DC2626">❌ Erro ao gerar token</h1>
            <pre style="background:#f4f4f5;padding:16px;border-radius:8px;overflow:auto;font-size:13px">${JSON.stringify(tokenData, null, 2)}</pre>
            <p><a href="/api/shipping/auth">Tentar novamente</a></p>
          </body>
        </html>
      `, { headers: { "Content-Type": "text/html" } })
    }

    // Decode JWT to show expiry info
    let tokenInfo = ""
    try {
      const payload = JSON.parse(atob(tokenData.access_token.split(".")[1]))
      const exp = new Date(payload.exp * 1000).toLocaleString("pt-BR")
      const iat = new Date(payload.iat * 1000).toLocaleString("pt-BR")
      tokenInfo = `
        <div style="background:#f0fdf4;padding:12px 16px;border-radius:8px;margin-top:12px">
          <strong>✅ Token válido!</strong><br>
          <small>Emitido: ${iat} | Expira: ${exp} | Scopes: ${(payload.scopes || []).join(", ")}</small>
        </div>`
    } catch { /* ignore decode error */ }

    return new Response(`
      <html>
        <head><title>✅ Token Gerado com Sucesso!</title></head>
        <body style="font-family:system-ui;max-width:800px;margin:40px auto;padding:20px">
          <h1 style="color:#16A34A;font-size:24px">🎉 Integração Melhor Envio Conectada!</h1>

          ${tokenInfo}

          <h2 style="margin-top:24px">📋 Próximo passo — Copie estes tokens:</h2>

          <div style="background:#1e293b;color:#e2e8f0;padding:20px;border-radius:10px;margin:12px 0">
            <label style="display:block;font-size:13px;color:#94a3b8;margin-bottom:6px">MELHOR_ENVIO_TOKEN (Access Token):</label>
            <textarea id="accessToken" readonly style="width:100%;height:80px;background:#0f172a;border:1px solid #334155;color:#f8fafc;padding:12px;border-radius:6px;font-size:11px;font-family:monospace;word-break:break-all">${tokenData.access_token}</textarea>
            <button onclick="copyText('accessToken')" style="margin-top:8px;background:#dc2626;color:white;border:none;padding:8px 20px;border-radius:6px;cursor:pointer;font-size:14px">📋 Copiar Access Token</button>
          </div>

          <div style="background:#1e293b;color:#e2e8f0;padding:20px;border-radius:10px;margin:12px 0">
            <label style="display:block;font-size:13px;color:#94a3b8;margin-bottom:6px">MELHOR_ENVIO_REFRESH_TOKEN:</label>
            <textarea id="refreshToken" readonly style="width:100%;height:60px;background:#0f172a;border:1px solid #334155;color:#f8fafc;padding:12px;border-radius:6px;font-size:11px;font-family:monospace;word-break:break-all">${tokenData.refresh_token}</textarea>
            <button onclick="copyText('refreshToken')" style="margin-top:8px;background:#dc2626;color:white;border:none;padding:8px 20px;border-radius:6px;cursor:pointer;font-size:14px">📋 Copiar Refresh Token</button>
          </div>

          <h3 style="margin-top:24px">🔧 Configure na Vercel:</h3>
          <ol style="line-height:2">
            <li>Acesse seu projeto na Vercel → Settings → Environment Variables</li>
            <li>Adicione/edite <code>MELHOR_ENVIO_TOKEN</code> → cole o Access Token</li>
            <li>Adicione <code>MELHOR_ENVIO_REFRESH_TOKEN</code> → cole o Refresh Token</li>
            <li>Salve e aguarde o redeploy automático (~2 min)</li>
            <li>Teste o cálculo de frete em qualquer produto!</li>
          </ol>

          <a href="/" style="display:inline-block;margin-top:24px;background:#18181b;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600">← Voltar à loja</a>

          <script>
            function copyText(id) {
              var el = document.getElementById(id)
              navigator.clipboard.writeText(el.value)
              var btn = el.parentElement.querySelector('button')
              var orig = btn.innerHTML
              btn.innerHTML = '✅ Copiado!'
              setTimeout(() => btn.innerHTML = orig, 2000)
            }
          </script>
        </body>
      </html>
    `, { headers: { "Content-Type": "text/html" } })

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return new Response(`<html><body><h1>Error: ${msg}</h1></body></html>`, { headers: { "Content-Type": "text/html" } })
  }
}

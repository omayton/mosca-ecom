import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"
import { rateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit"

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  )
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers)
  const { success } = rateLimit(`register:${ip}`, RATE_LIMITS.register)
  if (!success) {
    return NextResponse.json({ error: "Muitas tentativas. Aguarde alguns minutos." }, { status: 429 })
  }

  const supabase = getSupabase()
  const { email, password, name } = await req.json()

  if (!email || !password) {
    return NextResponse.json({ error: "Email e senha são obrigatórios." }, { status: 400 })
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  if (data.session) {
    const res = NextResponse.json({ user: data.user })

    res.cookies.set("sb-access-token", data.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: data.session.expires_in,
    })
    res.cookies.set("sb-refresh-token", data.session.refresh_token!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    })

    return res
  }

  return NextResponse.json({ message: "Verifique seu email para confirmar o cadastro." })
}

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { rateLimit, getClientIp } from "@/lib/rate-limit"

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  )
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers)
  const { success } = rateLimit(`reset:${ip}`, { limit: 3, windowSeconds: 300 })
  if (!success) {
    return NextResponse.json({ error: "Muitas tentativas. Aguarde alguns minutos." }, { status: 429 })
  }

  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ error: "Email é obrigatório." }, { status: 400 })
    }

    const supabase = getSupabase()

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/redefinir-senha`,
    })

    if (error) {
      console.error("[reset-password] error:", error.message)
    }

    // Always return success to prevent email enumeration
    return NextResponse.json({
      message: "Se o email estiver cadastrado, você receberá um link para redefinir sua senha."
    })
  } catch (e: any) {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"

function getAuthClient() {
  const cookieStore = cookies()
  const accessToken = cookieStore.get("sb-access-token")?.value

  if (!accessToken) return null

  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
      auth: { persistSession: false },
    }
  )

  return { client, accessToken }
}

export async function GET() {
  const auth = getAuthClient()
  if (!auth) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  const { data: { user } } = await auth.client.auth.getUser(auth.accessToken)
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  const { data: profile } = await auth.client
    .from("profiles")
    .select("name, phone, address_json")
    .eq("id", user.id)
    .single()

  return NextResponse.json({
    email: user.email,
    name: profile?.name || "",
    phone: profile?.phone || "",
    address_json: profile?.address_json || null,
  })
}

export async function PATCH(req: NextRequest) {
  const auth = getAuthClient()
  if (!auth) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  const { data: { user } } = await auth.client.auth.getUser(auth.accessToken)
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  const body = await req.json()
  const updates: Record<string, any> = {}

  if (body.name !== undefined) updates.name = body.name
  if (body.phone !== undefined) updates.phone = body.phone
  if (body.address_json !== undefined) updates.address_json = body.address_json

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nenhum campo para atualizar" }, { status: 400 })
  }

  const { error } = await auth.client
    .from("profiles")
    .update(updates)
    .eq("id", user.id)

  if (error) {
    return NextResponse.json({ error: "Erro ao atualizar perfil" }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

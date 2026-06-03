import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"

function getAuthClient() {
  const cookieStore = cookies()
  const accessToken = cookieStore.get("sb-access-token")?.value
  if (!accessToken) return null
  return {
    client: createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: { headers: { Authorization: `Bearer ${accessToken}` } },
        auth: { persistSession: false },
      }
    ),
    accessToken,
  }
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = getAuthClient()
  if (!auth) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  const { data: { user } } = await auth.client.auth.getUser(auth.accessToken)
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 })

  const { data: order } = await auth.client
    .from("orders")
    .select("id, status, payment_method")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single()

  if (!order) return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 })

  return NextResponse.json({ status: order.status, payment_method: order.payment_method })
}

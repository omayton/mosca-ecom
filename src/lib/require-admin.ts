import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean)

/**
 * Verifies that the current request comes from an authenticated admin user.
 * Returns the user if valid, or a NextResponse error if not.
 */
export async function requireAdmin(): Promise<
  | { user: { id: string; email: string }; error?: never }
  | { user?: never; error: NextResponse }
> {
  const cookieStore = cookies()
  const accessToken = cookieStore.get("sb-access-token")?.value

  if (!accessToken) {
    return { error: NextResponse.json({ error: "Não autenticado" }, { status: 401 }) }
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
      auth: { persistSession: false },
    }
  )

  const { data: { user } } = await supabase.auth.getUser(accessToken)

  if (!user || !user.email) {
    return { error: NextResponse.json({ error: "Não autenticado" }, { status: 401 }) }
  }

  // Block if list is empty (env not configured) OR user not in list
  if (ADMIN_EMAILS.length === 0 || !ADMIN_EMAILS.includes(user.email.toLowerCase())) {
    return { error: NextResponse.json({ error: "Acesso negado" }, { status: 403 }) }
  }

  return { user: { id: user.id, email: user.email } }
}

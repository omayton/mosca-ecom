import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"
import { AdminLayoutClient } from '@/components/admin/admin-layout-client'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean)

async function getAdminUser() {
  const cookieStore = cookies()
  const accessToken = cookieStore.get("sb-access-token")?.value
  if (!accessToken) return null

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
      auth: { persistSession: false },
    }
  )

  const { data: { user } } = await supabase.auth.getUser(accessToken)
  return user
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getAdminUser()

  if (!user || !user.email) {
    redirect("/login?redirect=/admin")
  }

  if (ADMIN_EMAILS.length === 0 || !ADMIN_EMAILS.includes(user.email.toLowerCase())) {
    redirect("/")
  }

  return <AdminLayoutClient>{children}</AdminLayoutClient>
}

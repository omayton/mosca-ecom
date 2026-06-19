import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

const PROTECTED_PATHS = ["/checkout", "/minha-conta", "/admin"]

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean)

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const pathname = req.nextUrl.pathname

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  const accessToken = req.cookies.get("sb-access-token")?.value
  const refreshToken = req.cookies.get("sb-refresh-token")?.value

  // No tokens at all — skip auth logic for non-protected paths
  if (!accessToken && !refreshToken) {
    if (isProtected(pathname)) {
      return redirectToLogin(req)
    }
    return res
  }

  // For non-protected paths, only attempt a token refresh if access token is missing
  // (avoid expensive getUser() call on every single page load)
  if (!isProtected(pathname) && accessToken) {
    return res
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false },
  })

  let hasValidSession = !!accessToken
  let user = null

  if (accessToken) {
    const { data: { user: fetchedUser } } = await supabase.auth.getUser(accessToken)
    user = fetchedUser
    hasValidSession = !!user
  }

  if (!user && refreshToken) {
    const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken })

    if (!error && data.session) {
      hasValidSession = true
      user = data.user
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
    } else {
      hasValidSession = false
    }
  }

  if (isProtected(pathname) && !hasValidSession) {
    return redirectToLogin(req)
  }

  if (pathname.startsWith("/admin") && hasValidSession) {
    const email = user?.email?.toLowerCase() || ""
    // Block if list is empty (env not configured) OR user not in list
    if (ADMIN_EMAILS.length === 0 || !ADMIN_EMAILS.includes(email)) {
      return NextResponse.redirect(new URL("/", req.url))
    }
  }

  return res
}

function isProtected(pathname: string) {
  return PROTECTED_PATHS.some((p) => pathname.startsWith(p))
}

function redirectToLogin(req: NextRequest) {
  const loginUrl = new URL("/login", req.url)
  loginUrl.searchParams.set("redirect", req.nextUrl.pathname)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/shipping|api/webhooks|api/auth/google).*)"],
}

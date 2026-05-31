import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

const PROTECTED_PATHS = ["/checkout", "/minha-conta"]

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  const accessToken = req.cookies.get("sb-access-token")?.value
  const refreshToken = req.cookies.get("sb-refresh-token")?.value

  let hasValidSession = !!accessToken

  if (!accessToken && !refreshToken) {
    if (isProtected(req.nextUrl.pathname)) {
      return redirectToLogin(req)
    }
    return res
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false },
  })

  const { data: { user } } = await supabase.auth.getUser(accessToken)

  if (!user && refreshToken) {
    const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken })

    if (!error && data.session) {
      hasValidSession = true
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
  } else if (user) {
    hasValidSession = true
  }

  if (isProtected(req.nextUrl.pathname) && !hasValidSession) {
    return redirectToLogin(req)
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
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/shipping|api/webhooks).*)"],
}

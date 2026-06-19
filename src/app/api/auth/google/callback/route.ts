import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error) {
    console.error('Google OAuth error:', error, searchParams.get('error_description'))
    return NextResponse.redirect('/login?error=google_denied')
  }

  if (!code) {
    return NextResponse.redirect('/login?error=google_no_code')
  }

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''

  if (!clientId || !clientSecret || !supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Google OAuth env vars')
    return NextResponse.redirect('/login?error=google_config')
  }

  try {
    // Exchange auth code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: `${appUrl}/api/auth/google/callback`,
        grant_type: 'authorization_code',
      }),
    })

    const tokenData = await tokenRes.json()

    if (!tokenRes.ok) {
      console.error('Google token exchange failed:', JSON.stringify(tokenData))
      return NextResponse.redirect('/login?error=google_token_failed')
    }

    const { id_token } = tokenData

    if (!id_token) {
      console.error('No id_token in Google response:', JSON.stringify(tokenData))
      return NextResponse.redirect('/login?error=google_no_id_token')
    }

    // Sign in with Supabase using anon key (not service role)
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
    })

    const { data, error: signInError } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: id_token,
    })

    if (signInError || !data.session) {
      console.error('Supabase signInWithIdToken failed:', signInError)
      return NextResponse.redirect('/login?error=google_auth_failed')
    }

    const session = data.session
    const res = NextResponse.redirect('/')

    res.cookies.set('sb-access-token', session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: session.expires_in,
    })
    res.cookies.set('sb-refresh-token', session.refresh_token!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    })

    return res
  } catch (err) {
    console.error('Google OAuth callback error:', err)
    return NextResponse.redirect('/login?error=google_callback_error')
  }
}

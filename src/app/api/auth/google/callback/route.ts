import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const gError = searchParams.get('error')

  if (gError) {
    return NextResponse.redirect('/login?error=google_denied')
  }

  if (!code) {
    return NextResponse.redirect('/login?error=no_code')
  }

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''

  if (!clientId || !clientSecret || !supabaseUrl || !supabaseAnonKey) {
    const missing = []
    if (!clientId) missing.push('CLIENT_ID')
    if (!clientSecret) missing.push('CLIENT_SECRET')
    if (!supabaseUrl) missing.push('SUPABASE_URL')
    if (!supabaseAnonKey) missing.push('ANON_KEY')
    console.error('Missing env vars:', missing.join(', '))
    return NextResponse.redirect(`/login?error=missing_vars_${missing.join('_')}`)
  }

  try {
    // Step 1: Exchange code for tokens
    let tokenRes: Response
    try {
      tokenRes = await fetch('https://oauth2.googleapis.com/token', {
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
    } catch (fetchErr) {
      const msg = fetchErr instanceof Error ? fetchErr.message : String(fetchErr)
      console.error('Fetch to Google failed:', msg)
      return NextResponse.redirect(`/login?error=fetch_failed&detail=${encodeURIComponent(msg)}`)
    }

    let tokenData: any
    try {
      tokenData = await tokenRes.json()
    } catch (jsonErr) {
      return NextResponse.redirect('/login?error=token_parse')
    }

    if (!tokenRes.ok) {
      console.error('Token exchange error:', JSON.stringify(tokenData))
      return NextResponse.redirect(`/login?error=token_exchange&detail=${encodeURIComponent(tokenData.error || 'unknown')}`)
    }

    const idToken = tokenData.id_token

    if (!idToken) {
      console.error('No id_token in response:', JSON.stringify(Object.keys(tokenData)))
      return NextResponse.redirect('/login?error=no_id_token')
    }

    // Step 2: Sign in with Supabase
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
    })

    const { data, error: signInError } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
    })

    if (signInError) {
      console.error('signInWithIdToken error:', signInError.message)
      return NextResponse.redirect(`/login?error=signin_failed&detail=${encodeURIComponent(signInError.message)}`)
    }

    if (!data.session) {
      return NextResponse.redirect('/login?error=no_session')
    }

    // Step 3: Set cookies and redirect
    const session = data.session
    const redirectUrl = new URL('/', req.url)

    const res = NextResponse.redirect(redirectUrl.toString())
    res.cookies.set('sb-access-token', session.access_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: session.expires_in,
    })
    res.cookies.set('sb-refresh-token', session.refresh_token!, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    })

    return res
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('Callback unhandled error:', msg, err)
    return NextResponse.redirect(`/login?error=catch&detail=${encodeURIComponent(msg)}`)
  }
}

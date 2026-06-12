import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

function detectDevice(ua: string): string {
  if (/Mobile|Android|iPhone|iPad/i.test(ua)) {
    return /iPad/i.test(ua) ? 'tablet' : 'mobile'
  }
  return 'desktop'
}

// Paths to ignore (bots, admin, api, static assets)
const IGNORE_PREFIXES = ['/api/', '/admin', '/_next', '/favicon', '/robots', '/sitemap']

export async function POST(req: NextRequest) {
  try {
    const { path, referrer } = await req.json()

    if (!path || typeof path !== 'string') {
      return NextResponse.json({ ok: false })
    }

    // Skip non-user paths
    if (IGNORE_PREFIXES.some(p => path.startsWith(p))) {
      return NextResponse.json({ ok: true })
    }

    const ua = req.headers.get('user-agent') || ''

    // Skip obvious bots
    if (/bot|crawl|spider|slurp|ia_archiver|facebookexternalhit/i.test(ua)) {
      return NextResponse.json({ ok: true })
    }

    await getSupabase().from('page_views').insert({
      path,
      referrer: referrer || null,
      device: detectDevice(ua),
    })

    return NextResponse.json({ ok: true })
  } catch {
    // Never fail silently — fire and forget from client
    return NextResponse.json({ ok: true })
  }
}

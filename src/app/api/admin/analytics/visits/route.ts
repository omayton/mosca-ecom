import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/require-admin'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

function todayStart(): string {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

export async function GET(req: NextRequest) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  try {
    const supabase = getSupabase()
    const monthAgo = daysAgo(30)
    const weekAgo  = daysAgo(7)
    const today    = todayStart()

    // Fetch last 30 days of data in one query
    const { data: rows, error } = await supabase
      .from('page_views')
      .select('path, device, created_at')
      .gte('created_at', monthAgo)
      .order('created_at', { ascending: true })

    if (error) throw error

    const allRows = rows || []

    // Counters
    let countToday = 0, countWeek = 0, countMonth = allRows.length
    const dailyMap: Record<string, number> = {}
    const pagesMap: Record<string, number> = {}
    const deviceMap: Record<string, number> = { mobile: 0, desktop: 0, tablet: 0 }

    for (const row of allRows) {
      const ts = row.created_at
      if (ts >= today)   countToday++
      if (ts >= weekAgo) countWeek++

      // Daily bucketing
      const day = ts.slice(0, 10) // YYYY-MM-DD
      dailyMap[day] = (dailyMap[day] || 0) + 1

      // Top pages
      const p = row.path
      pagesMap[p] = (pagesMap[p] || 0) + 1

      // Device
      const d = row.device || 'desktop'
      deviceMap[d] = (deviceMap[d] || 0) + 1
    }

    // Fill missing days with 0 for a complete 30-day chart
    const daily: Array<{ date: string; count: number }> = []
    for (let i = 29; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      daily.push({ date: key, count: dailyMap[key] || 0 })
    }

    // Top 10 pages by views
    const topPages = Object.entries(pagesMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([path, count]) => ({ path, count }))

    // Total ever
    const { count: total } = await supabase
      .from('page_views')
      .select('id', { count: 'exact', head: true })

    return NextResponse.json({
      today:    countToday,
      week:     countWeek,
      month:    countMonth,
      total:    total || 0,
      daily,
      topPages,
      devices:  deviceMap,
    })
  } catch (err: any) {
    console.error('[analytics/visits]', err.message)
    return NextResponse.json({ error: 'Erro ao buscar analytics' }, { status: 500 })
  }
}

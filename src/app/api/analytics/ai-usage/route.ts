import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/require-admin'

function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(req: NextRequest) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  try {
    const { searchParams } = new URL(req.url)
    const period = searchParams.get('period') || '7d'
    const supabase = getSupabaseClient()

    let startDate = new Date()
    switch (period) {
      case '1d':
        startDate.setDate(startDate.getDate() - 1)
        break
      case '7d':
        startDate.setDate(startDate.getDate() - 7)
        break
      case '30d':
        startDate.setDate(startDate.getDate() - 30)
        break
      case '90d':
        startDate.setDate(startDate.getDate() - 90)
        break
      default:
        startDate.setDate(startDate.getDate() - 7)
    }

    const { data: analytics, error } = await supabase
      .from('ai_usage_analytics')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })

    if (error) {
      // Table might not exist yet — return empty data gracefully
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return NextResponse.json({
          period,
          startDate: startDate.toISOString(),
          endDate: new Date().toISOString(),
          summary: {
            totalRequests: 0,
            totalTokens: 0,
            totalCostUsd: 0,
            cacheHitRate: 0,
            fallbackRate: 0,
            avgResponseTimeMs: 0,
            modelUsage: {},
          },
          topVehicles: [],
          data: [],
        })
      }
      throw error
    }

    const rows = analytics || []

    const summary = {
      totalRequests: rows.length,
      totalTokens: rows.reduce((sum, a) => sum + (a.total_tokens || 0), 0),
      totalCostUsd: rows.reduce((sum, a) => sum + (a.estimated_cost_usd || 0), 0),
      cacheHitRate: rows.length > 0
        ? (rows.filter(a => a.cache_hit).length / rows.length) * 100
        : 0,
      fallbackRate: rows.length > 0
        ? (rows.filter(a => a.fallback_used).length / rows.length) * 100
        : 0,
      avgResponseTimeMs: rows.length > 0
        ? rows.reduce((sum, a) => sum + (a.response_time_ms || 0), 0) / rows.length
        : 0,
      modelUsage: rows.reduce((acc: Record<string, number>, a) => {
        const model = a.model_used || 'unknown'
        acc[model] = (acc[model] || 0) + 1
        return acc
      }, {})
    }

    const topVehicles = rows
      .filter(a => a.vehicle_brand)
      .reduce((acc: Record<string, number>, a) => {
        const key = `${a.vehicle_brand} ${a.vehicle_model} ${a.vehicle_year}`
        acc[key] = (acc[key] || 0) + 1
        return acc
      }, {})

    const sortedTopVehicles = Object.entries(topVehicles)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([vehicle, count]) => ({ vehicle, count }))

    return NextResponse.json({
      period,
      startDate: startDate.toISOString(),
      endDate: new Date().toISOString(),
      summary,
      topVehicles: sortedTopVehicles,
      data: rows
    })
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar analytics. Tente novamente.' },
      { status: 500 }
    )
  }
}
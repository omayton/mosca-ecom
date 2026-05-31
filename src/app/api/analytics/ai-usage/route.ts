import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(req: NextRequest) {
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
      .from('ai_analytics')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })

    if (error) throw error

    const summary = {
      totalRequests: analytics.length,
      totalTokens: analytics.reduce((sum, a) => sum + (a.total_tokens || 0), 0),
      totalCostUsd: analytics.reduce((sum, a) => sum + (a.estimated_cost_usd || 0), 0),
      cacheHitRate: analytics.length > 0
        ? (analytics.filter(a => a.cache_hit).length / analytics.length) * 100
        : 0,
      fallbackRate: analytics.length > 0
        ? (analytics.filter(a => a.fallback_used).length / analytics.length) * 100
        : 0,
      avgResponseTimeMs: analytics.length > 0
        ? analytics.reduce((sum, a) => sum + (a.response_time_ms || 0), 0) / analytics.length
        : 0,
      modelUsage: analytics.reduce((acc: Record<string, number>, a) => {
        const model = a.model_used || 'unknown'
        acc[model] = (acc[model] || 0) + 1
        return acc
      }, {})
    }

    const topVehicles = analytics
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
      data: analytics
    })
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar analytics. Tente novamente.' },
      { status: 500 }
    )
  }
}
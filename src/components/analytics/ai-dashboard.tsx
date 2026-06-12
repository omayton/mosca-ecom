'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Zap, Database, Clock, DollarSign, Car, Bot } from 'lucide-react'

interface AnalyticsData {
  period: string
  summary: {
    totalRequests: number
    totalTokens: number
    totalCostUsd: number
    cacheHitRate: number
    fallbackRate: number
    avgResponseTimeMs: number
    modelUsage: Record<string, number>
  }
  topVehicles: Array<{ vehicle: string; count: number }>
  _tableError?: string
}

type PeriodOption = '1d' | '7d' | '30d' | '90d'

function fmt(n: number) {
  return new Intl.NumberFormat('pt-BR').format(n)
}

function StatCard({ icon: Icon, title, value, badge }: {
  icon: React.ElementType; title: string; value: string
  badge?: { label: string; good: boolean }
}) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-amber-400" />
          <span className="text-white/40 text-sm">{title}</span>
        </div>
        {badge && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            badge.good ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
          }`}>
            {badge.label}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  )
}

export function AIDashboard() {
  const [period,  setPeriod]  = useState<PeriodOption>('7d')
  const [data,    setData]    = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    fetch(`/api/analytics/ai-usage?period=${period}`)
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else setData(d) })
      .catch(() => setError('Erro de conexão'))
      .finally(() => setLoading(false))
  }, [period])

  const periods: Array<{ id: PeriodOption; label: string }> = [
    { id: '1d',  label: '24h' },
    { id: '7d',  label: '7 dias' },
    { id: '30d', label: '30 dias' },
    { id: '90d', label: '90 dias' },
  ]

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-24 bg-white/[0.03] animate-pulse rounded-xl" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
        <p className="font-medium">{error}</p>
      </div>
    )
  }

  if (!data) return null

  const isEmpty = data.summary.totalRequests === 0

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex items-center gap-1 bg-white/[0.03] border border-white/[0.06] rounded-xl p-1 w-fit">
        {periods.map(p => (
          <button
            key={p.id}
            onClick={() => setPeriod(p.id)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              period === p.id
                ? 'bg-amber-400 text-zinc-900'
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-white/[0.03] flex items-center justify-center mb-4">
            <Bot className="h-8 w-8 text-white/20" />
          </div>
          <p className="text-white/40 font-medium">Sem dados de IA no período</p>
          <p className="text-white/20 text-sm mt-1">
            {data._tableError
              ? 'A tabela ai_usage_analytics pode não existir ainda no banco.'
              : 'As buscas por veículo gerarão dados aqui.'}
          </p>
          {data._tableError && (
            <p className="text-amber-400/60 text-xs mt-3 max-w-xs">
              Execute a migration <code>2025-05-31_vehicle_cache_analytics.sql</code> no Supabase SQL Editor.
            </p>
          )}
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard icon={Zap}        title="Requisições"          value={fmt(data.summary.totalRequests)} />
            <StatCard icon={Database}   title="Tokens totais"         value={fmt(data.summary.totalTokens)} />
            <StatCard icon={DollarSign} title="Custo estimado"        value={`US$ ${data.summary.totalCostUsd.toFixed(4)}`} />
            <StatCard
              icon={TrendingUp} title="Cache hit rate"
              value={`${data.summary.cacheHitRate.toFixed(1)}%`}
              badge={{ label: data.summary.cacheHitRate >= 50 ? 'Bom' : 'Atenção', good: data.summary.cacheHitRate >= 50 }}
            />
            <StatCard icon={Clock} title="Tempo médio"
              value={`${(data.summary.avgResponseTimeMs / 1000).toFixed(2)}s`}
            />
            <StatCard
              icon={TrendingDown} title="Taxa de fallback"
              value={`${data.summary.fallbackRate.toFixed(1)}%`}
              badge={{ label: data.summary.fallbackRate <= 20 ? 'Bom' : 'Atenção', good: data.summary.fallbackRate <= 20 }}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Model usage */}
            {Object.keys(data.summary.modelUsage).length > 0 && (
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
                <h3 className="text-white font-semibold mb-4">Uso por modelo</h3>
                <div className="space-y-3">
                  {Object.entries(data.summary.modelUsage)
                    .sort((a, b) => b[1] - a[1])
                    .map(([model, count]) => (
                      <div key={model} className="flex items-center justify-between">
                        <span className="text-white/60 text-sm font-mono">{model}</span>
                        <span className="text-white font-semibold text-sm">{count}x</span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Top vehicles */}
            {data.topVehicles.length > 0 && (
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
                <h3 className="text-white font-semibold mb-4">Veículos mais buscados</h3>
                <div className="space-y-3">
                  {data.topVehicles.map(({ vehicle, count }, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-white/20 text-xs w-4 text-right">{i + 1}</span>
                      <Car className="h-3.5 w-3.5 text-amber-400/60 flex-shrink-0" />
                      <span className="flex-1 text-white/60 text-sm truncate">{vehicle}</span>
                      <span className="text-white font-semibold text-sm">{count}x</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

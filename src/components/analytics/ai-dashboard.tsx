'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Zap, Database, Clock, DollarSign, Car } from 'lucide-react'

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
}

type PeriodOption = '1d' | '7d' | '30d' | '90d'

export function AIDashboard() {
  const [period, setPeriod] = useState<PeriodOption>('7d')
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)

      try {
        const res = await fetch(`/api/analytics/ai-usage?period=${period}`)
        const json = await res.json()

        if (res.ok) {
          setData(json)
        } else {
          setError(json.error || 'Erro ao carregar analytics')
        }
      } catch (err) {
        setError('Erro de conexão. Tente novamente.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [period])

  const formatCurrency = (value: number) => {
    return `US$ ${value.toFixed(4)}`
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value)
  }

  const getPeriodLabel = (p: PeriodOption) => {
    const labels = { '1d': '24h', '7d': '7 dias', '30d': '30 dias', '90d': '90 dias' }
    return labels[p]
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-red-500 border-r-transparent" />
          <p className="mt-4 text-sm text-zinc-500">Carregando analytics...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600 font-medium">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-zinc-900">Analytics de IA</h2>
        <div className="flex gap-2">
          {(['1d', '7d', '30d', '90d'] as PeriodOption[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium transition-colors
                ${period === p
                  ? 'bg-red-600 text-white'
                  : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                }
              `}
            >
              {getPeriodLabel(p)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          icon={Zap}
          title="Total de Requisições"
          value={data.summary.totalRequests.toString()}
          change={null}
        />
        <StatCard
          icon={TrendingUp}
          title="Taxa de Cache Hit"
          value={`${data.summary.cacheHitRate.toFixed(1)}%`}
          change={data.summary.cacheHitRate >= 50 ? 'positive' : 'negative'}
        />
        <StatCard
          icon={Database}
          title="Tokens Totais"
          value={formatNumber(data.summary.totalTokens)}
          change={null}
        />
        <StatCard
          icon={DollarSign}
          title="Custo Estimado"
          value={formatCurrency(data.summary.totalCostUsd)}
          change={null}
        />
        <StatCard
          icon={Clock}
          title="Tempo Médio de Resposta"
          value={`${(data.summary.avgResponseTimeMs / 1000).toFixed(2)}s`}
          change={null}
        />
        <StatCard
          icon={TrendingDown}
          title="Taxa de Fallback"
          value={`${data.summary.fallbackRate.toFixed(1)}%`}
          change={data.summary.fallbackRate <= 20 ? 'positive' : 'negative'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Uso por Modelo">
          <div className="space-y-3">
            {Object.entries(data.summary.modelUsage).map(([model, count]) => (
              <div key={model} className="flex items-center justify-between">
                <span className="text-sm text-zinc-700">{model}</span>
                <span className="text-sm font-semibold text-zinc-900">{count}x</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Top Veículos">
          <div className="space-y-3">
            {data.topVehicles.map(({ vehicle, count }, i) => (
              <div key={i} className="flex items-center gap-3">
                <Car className="h-4 w-4 text-zinc-400 flex-shrink-0" />
                <span className="flex-1 text-sm text-zinc-700">{vehicle}</span>
                <span className="text-sm font-semibold text-zinc-900">{count}x</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

interface StatCardProps {
  icon: any
  title: string
  value: string
  change: 'positive' | 'negative' | null
}

function StatCard({ icon: Icon, title, value, change }: StatCardProps) {
  return (
    <div className="bg-white border border-zinc-200 rounded-lg p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Icon className="h-5 w-5 text-red-500" />
            <h3 className="text-sm font-medium text-zinc-600">{title}</h3>
          </div>
          <p className="text-3xl font-bold text-zinc-900">{value}</p>
        </div>
        {change && (
          <div className={`
            flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
            ${change === 'positive'
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
            }
          `}>
            {change === 'positive' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {change === 'positive' ? 'Bom' : 'Atenção'}
          </div>
        )}
      </div>
    </div>
  )
}

interface CardProps {
  title: string
  children: React.ReactNode
}

function Card({ title, children }: CardProps) {
  return (
    <div className="bg-white border border-zinc-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-zinc-900 mb-4">{title}</h3>
      {children}
    </div>
  )
}
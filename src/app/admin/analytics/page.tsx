'use client'

import { useState, useEffect } from 'react'
import { Users, TrendingUp, Eye, Smartphone, Monitor, Tablet, BarChart3 } from 'lucide-react'
import { AIDashboard } from '@/components/analytics/ai-dashboard'

// ── Types ─────────────────────────────────────────────────────────────────────

interface VisitsData {
  today:    number
  week:     number
  month:    number
  total:    number
  daily:    Array<{ date: string; count: number }>
  topPages: Array<{ path: string; count: number }>
  devices:  { mobile: number; desktop: number; tablet: number }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

function fmtDate(iso: string) {
  if (!iso) return ''
  const [, m, d] = iso.split('-')
  return `${d}/${m}`
}

function pathLabel(path: string) {
  if (path === '/') return 'Home'
  if (path.startsWith('/produto/')) return '🔩 ' + path.replace('/produto/', '').replace(/-/g, ' ').slice(0, 38)
  if (path === '/loja')       return 'Loja'
  if (path === '/checkout')   return 'Checkout'
  if (path === '/login')      return 'Login'
  if (path === '/registro')   return 'Cadastro'
  if (path === '/minha-conta') return 'Minha Conta'
  return path.slice(0, 42)
}

// ── Mini bar chart ────────────────────────────────────────────────────────────

function BarChart({ data }: { data: Array<{ date: string; count: number }> }) {
  const max = Math.max(...data.map(d => d.count), 1)
  return (
    <div className="flex items-end gap-px h-24 w-full">
      {data.map((d, i) => {
        const pct     = Math.max((d.count / max) * 100, d.count > 0 ? 4 : 0)
        const isToday = i === data.length - 1
        return (
          <div key={d.date} className="flex-1 flex flex-col items-center group relative">
            <div
              className={`w-full rounded-t-sm transition-all duration-300 ${
                isToday ? 'bg-amber-400' : 'bg-white/10 group-hover:bg-white/25'
              }`}
              style={{ height: `${pct}%` }}
            />
            {/* Tooltip */}
            <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:block pointer-events-none z-10">
              <div className="bg-zinc-900 border border-white/10 text-white text-xs px-2 py-1 rounded whitespace-nowrap shadow-xl">
                <span className="font-semibold">{d.count}</span> visitas · {fmtDate(d.date)}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, icon: Icon, color }: {
  label: string; value: number; sub?: string
  icon: React.ElementType; color: string
}) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-white/40 text-sm">{label}</span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="text-3xl font-bold text-white">{fmt(value)}</p>
      {sub && <p className="text-white/30 text-xs mt-1">{sub}</p>}
    </div>
  )
}

// ── Visits dashboard ──────────────────────────────────────────────────────────

function VisitsDashboard() {
  const [data,    setData]    = useState<VisitsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/analytics/visits')
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else setData(d) })
      .catch(() => setError('Erro ao carregar dados'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 bg-white/[0.03] animate-pulse rounded-xl" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
        <p className="font-medium mb-1">{error}</p>
        <p className="text-white/40 text-xs">
          Execute a migration <code className="text-amber-400">2026-06-12_page_analytics.sql</code> no Supabase SQL Editor e aguarde a primeira visita ser registrada.
        </p>
      </div>
    )
  }

  if (!data) return null

  const totalDev  = (data.devices.mobile + data.devices.desktop + data.devices.tablet) || 1
  const mobilePct  = Math.round((data.devices.mobile  / totalDev) * 100)
  const desktopPct = Math.round((data.devices.desktop / totalDev) * 100)
  const tabletPct  = Math.round((data.devices.tablet  / totalDev) * 100)

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Hoje"    value={data.today} sub="visitas no dia"   icon={Eye}        color="bg-amber-500/10 text-amber-400" />
        <StatCard label="7 dias"  value={data.week}  sub="última semana"    icon={TrendingUp} color="bg-blue-500/10 text-blue-400" />
        <StatCard label="30 dias" value={data.month} sub="último mês"       icon={BarChart3}  color="bg-purple-500/10 text-purple-400" />
        <StatCard label="Total"   value={data.total} sub="desde o início"   icon={Users}      color="bg-emerald-500/10 text-emerald-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-white font-semibold">Visitas — últimos 30 dias</h3>
              <p className="text-white/30 text-xs mt-0.5">Passe o mouse nas barras para ver o detalhe · Amarelo = hoje</p>
            </div>
          </div>
          <BarChart data={data.daily} />
          <div className="flex justify-between mt-2 px-1">
            <span className="text-white/20 text-[10px]">{fmtDate(data.daily[0]?.date)}</span>
            <span className="text-white/20 text-[10px]">{fmtDate(data.daily[14]?.date)}</span>
            <span className="text-white/20 text-[10px]">Hoje</span>
          </div>
        </div>

        {/* Devices */}
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
          <h3 className="text-white font-semibold mb-5">Dispositivos</h3>
          <div className="space-y-5">
            {([
              { label: 'Mobile',  pct: mobilePct,  count: data.devices.mobile,  Icon: Smartphone, color: 'bg-blue-500' },
              { label: 'Desktop', pct: desktopPct, count: data.devices.desktop, Icon: Monitor,    color: 'bg-purple-500' },
              { label: 'Tablet',  pct: tabletPct,  count: data.devices.tablet,  Icon: Tablet,     color: 'bg-emerald-500' },
            ] as const).map(({ label, pct, count, Icon, color }) => (
              <div key={label}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 text-white/60 text-sm">
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </div>
                  <div>
                    <span className="text-white font-semibold text-sm">{pct}%</span>
                    <span className="text-white/30 text-xs ml-1">({count})</span>
                  </div>
                </div>
                <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                  <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            ))}
          </div>

          {data.total === 0 && (
            <div className="mt-6 p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
              <p className="text-amber-400/70 text-xs leading-relaxed">
                Aguardando primeiras visitas. O rastreamento começa após o deploy ser concluído.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Top pages */}
      {data.topPages.length > 0 && (
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5">
          <h3 className="text-white font-semibold mb-4">Páginas mais visitadas — últimos 30 dias</h3>
          <div className="space-y-3">
            {data.topPages.map((page, i) => {
              const maxVal = data.topPages[0]?.count || 1
              const pct    = Math.round((page.count / maxVal) * 100)
              return (
                <div key={page.path} className="flex items-center gap-3">
                  <span className="text-white/20 text-xs w-4 text-right flex-shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white/70 text-sm truncate">{pathLabel(page.path)}</span>
                      <span className="text-white font-semibold text-sm ml-3 flex-shrink-0">{page.count.toLocaleString('pt-BR')}</span>
                    </div>
                    <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
                      <div className="h-full bg-amber-400/40 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminAnalyticsPage() {
  const [tab, setTab] = useState<'visits' | 'ai'>('visits')

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">Analytics</h1>
        <p className="text-white/30 mt-1 text-sm">Visitas do site e uso de IA</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 bg-white/[0.03] border border-white/[0.06] rounded-xl p-1 w-fit">
        {([
          { id: 'visits', label: '📊 Visitas do Site' },
          { id: 'ai',     label: '🤖 Analytics IA' },
        ] as const).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
              tab === t.id
                ? 'bg-amber-400 text-zinc-900'
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'visits' ? <VisitsDashboard /> : <AIDashboard />}
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import {
  Package, ShoppingCart, Users, AlertTriangle,
  TrendingUp, TrendingDown, DollarSign, ArrowUpRight, ArrowDownRight,
  Clock, Truck, BarChart3
} from 'lucide-react'
import Link from 'next/link'

interface DashboardData {
  totalProducts: number
  totalOrders: number
  totalCustomers: number
  lowStockCount: number
  revenueToday: number
  ordersToday: number
  revenueWeek: number
  revenueTrend: number
  ordersThisWeek: number
  ordersTrend: number
  dailyRevenue: { date: string; revenue: number; orders: number }[]
  recentOrders: { id: number; total: string; status: string; created_at: string; shipping_method?: string }[]
  hasData?: boolean
  apiError?: boolean
}

function fmt(n: number): string {
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function statusLabel(status: string) {
  const map: Record<string, { label: string; color: string }> = {
    pending: { label: 'Pendente', color: 'text-amber-400 bg-amber-500/10' },
    confirmed: { label: 'Confirmado', color: 'text-emerald-400 bg-emerald-500/10' },
    shipped: { label: 'Enviado', color: 'text-blue-400 bg-blue-500/10' },
    delivered: { label: 'Entregue', color: 'text-emerald-400 bg-emerald-500/10' },
    cancelled: { label: 'Cancelado', color: 'text-red-400 bg-red-500/10' },
  }
  return map[status] || { label: status, color: 'text-white/40 bg-white/5' }
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const res = await fetch('/api/admin/dashboard')
        if (res.ok) {
          setData(await res.json())
        }
      } catch (err) {
        console.error('Failed to fetch metrics:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchMetrics()
  }, [])

  const maxDailyRevenue = Math.max(...(data?.dailyRevenue?.map(d => d.revenue) || [0]), 1)

  return (
    <div className="p-6 lg:p-8 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] font-medium text-emerald-400/80 uppercase tracking-[0.15em]">
            Sistema Online
          </span>
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Dashboard</h1>
        <p className="text-white/30 mt-1 text-sm">Visão geral do e-commerce</p>
      </div>

      {/* Error/Empty states */}
      {!loading && data?.apiError && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-300">Erro ao conectar com o banco de dados.</p>
        </div>
      )}

      {/* Primary Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <MetricCard
          icon={DollarSign}
          title="Receita (7 dias)"
          value={loading ? '—' : `R$ ${fmt(data?.revenueWeek || 0)}`}
          trend={data?.revenueTrend || 0}
          accent="amber"
        />
        <MetricCard
          icon={ShoppingCart}
          title="Pedidos (7 dias)"
          value={loading ? '—' : String(data?.ordersThisWeek || 0)}
          trend={data?.ordersTrend || 0}
          accent="emerald"
        />
        <MetricCard
          icon={Package}
          title="Produtos"
          value={loading ? '—' : String(data?.totalProducts || 0)}
          trend={null}
          accent="blue"
        />
        <MetricCard
          icon={Users}
          title="Clientes"
          value={loading ? '—' : String(data?.totalCustomers || 0)}
          trend={null}
          accent="purple"
        />
      </div>

      {/* Secondary metrics row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <MiniStat label="Receita Hoje" value={loading ? '—' : `R$ ${fmt(data?.revenueToday || 0)}`} />
        <MiniStat label="Pedidos Hoje" value={loading ? '—' : String(data?.ordersToday || 0)} />
        <MiniStat label="Total Pedidos" value={loading ? '—' : String(data?.totalOrders || 0)} />
        <MiniStat
          label="Estoque Baixo"
          value={loading ? '—' : String(data?.lowStockCount || 0)}
          alert={(data?.lowStockCount || 0) > 0}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-[#111113] border border-white/[0.06] rounded-xl p-5">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-amber-400/60" />
              <h3 className="text-sm font-medium text-white/60">Receita — Últimos 7 dias</h3>
            </div>
            <p className="text-lg font-bold text-white">R$ {fmt(data?.revenueWeek || 0)}</p>
          </div>

          {loading ? (
            <div className="h-32 flex items-center justify-center text-white/20 text-sm">Carregando...</div>
          ) : (
            <div className="flex items-end gap-2 h-32">
              {(data?.dailyRevenue || []).map((day, i) => {
                const pct = maxDailyRevenue > 0 ? (day.revenue / maxDailyRevenue) * 100 : 0
                const dateObj = new Date(day.date + 'T12:00:00')
                const label = dateObj.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <div
                      className={`w-full rounded-md transition-all duration-500 ${
                        pct > 0
                          ? 'bg-gradient-to-t from-amber-500/40 to-amber-500/10 border border-amber-500/20'
                          : 'bg-white/[0.03] border border-white/[0.04]'
                      }`}
                      style={{ height: `${Math.max(pct, 4)}%` }}
                      title={`${label}: R$ ${fmt(day.revenue)} (${day.orders} pedidos)`}
                    />
                    <span className="text-[10px] text-white/30">{label}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <div className="bg-[#111113] border border-white/[0.06] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-white/60">Últimos Pedidos</h3>
            <Link href="/admin/pedidos" className="text-xs text-amber-400 hover:text-amber-300 transition-colors">
              Ver todos
            </Link>
          </div>

          {loading ? (
            <div className="text-white/20 text-sm text-center py-8">Carregando...</div>
          ) : !data?.recentOrders?.length ? (
            <div className="text-white/20 text-sm text-center py-8">Nenhum pedido ainda</div>
          ) : (
            <div className="space-y-2.5">
              {data.recentOrders.map((order) => {
                const st = statusLabel(order.status)
                return (
                  <div key={order.id} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                    <div>
                      <p className="text-sm text-white font-medium">#{order.id}</p>
                      <p className="text-[11px] text-white/30">
                        {new Date(order.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-white font-semibold">R$ {fmt(parseFloat(order.total) || 0)}</p>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${st.color}`}>
                        {st.label}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-6">
        <h2 className="text-xs font-medium text-white/30 uppercase tracking-[0.1em] mb-3">Ações Rápidas</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <QuickAction href="/admin/produtos" label="Novo Produto" icon={Package} />
          <QuickAction href="/admin/estoque" label="Ajustar Estoque" icon={AlertTriangle} />
          <QuickAction href="/admin/pedidos" label="Ver Pedidos" icon={ShoppingCart} />
          <QuickAction href="/admin/cupons" label="Criar Cupom" icon={DollarSign} />
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex items-center gap-6 py-3 px-4 bg-[#111113] border border-white/[0.06] rounded-xl">
        <StatusDot color="emerald" label="API" />
        <StatusDot color="emerald" label="Supabase" />
        <StatusDot color="emerald" label="MercadoPago" />
        <div className="ml-auto flex items-center gap-2">
          <Clock className="h-3 w-3 text-white/20" />
          <span className="text-[10px] text-white/30">
            {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  )
}

function MetricCard({ icon: Icon, title, value, trend, accent }: {
  icon: any; title: string; value: string; trend: number | null; accent: string
}) {
  const accentMap: Record<string, { border: string; icon: string }> = {
    amber: { border: 'border-amber-500/10', icon: 'text-amber-400/60' },
    emerald: { border: 'border-emerald-500/10', icon: 'text-emerald-400/60' },
    blue: { border: 'border-blue-500/10', icon: 'text-blue-400/60' },
    purple: { border: 'border-purple-500/10', icon: 'text-purple-400/60' },
    red: { border: 'border-red-500/10', icon: 'text-red-400/60' },
  }
  const colors = accentMap[accent] || accentMap.amber

  return (
    <div className={`bg-[#111113] border ${colors.border} rounded-xl p-4 hover:border-white/10 transition-all`}>
      <div className="flex items-center justify-between mb-3">
        <Icon className={`h-4 w-4 ${colors.icon}`} />
        {trend !== null && trend !== 0 && (
          <div className={`flex items-center gap-0.5 ${trend > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {trend > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            <span className="text-[10px] font-medium">{trend > 0 ? '+' : ''}{trend}%</span>
          </div>
        )}
      </div>
      <p className="text-[10px] font-medium text-white/30 uppercase tracking-wider mb-0.5">{title}</p>
      <p className="text-xl font-bold text-white tracking-tight">{value}</p>
    </div>
  )
}

function MiniStat({ label, value, alert }: { label: string; value: string; alert?: boolean }) {
  return (
    <div className="bg-[#111113] border border-white/[0.04] rounded-lg px-4 py-3">
      <p className="text-[10px] text-white/30 uppercase tracking-wider mb-0.5">{label}</p>
      <p className={`text-base font-semibold ${alert ? 'text-amber-400' : 'text-white/80'}`}>{value}</p>
    </div>
  )
}

function QuickAction({ href, label, icon: Icon }: { href: string; label: string; icon: any }) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 p-3.5 bg-[#111113] border border-white/[0.06] rounded-xl hover:border-amber-500/20 transition-all cursor-pointer"
    >
      <Icon className="h-4 w-4 text-white/20 group-hover:text-amber-400/60 transition-colors" />
      <span className="text-sm font-medium text-white/50 group-hover:text-white/80 transition-colors">{label}</span>
    </Link>
  )
}

function StatusDot({ color, label }: { color: string; label: string }) {
  const colorMap: Record<string, string> = { emerald: 'bg-emerald-400', amber: 'bg-amber-400', red: 'bg-red-400' }
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-1.5 h-1.5 rounded-full ${colorMap[color]} animate-pulse`} />
      <span className="text-[10px] text-white/40">{label}</span>
    </div>
  )
}

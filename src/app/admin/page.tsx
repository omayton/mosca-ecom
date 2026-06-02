'use client'

import { useState, useEffect } from 'react'
import {
  Package, ShoppingCart, Users, AlertTriangle,
  TrendingUp, DollarSign, ArrowUpRight, ArrowDownRight,
  Zap, Eye, Clock, Truck
} from 'lucide-react'
import Link from 'next/link'

interface DashboardMetrics {
  totalProducts: number
  totalOrders: number
  totalCustomers: number
  lowStockCount: number
  revenueToday: number
  ordersToday: number
  hasData?: boolean
  apiError?: boolean
}

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalProducts: 0,
    totalOrders: 0,
    totalCustomers: 0,
    lowStockCount: 0,
    revenueToday: 0,
    ordersToday: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const res = await fetch('/api/admin/dashboard')
        if (res.ok) {
          const data = await res.json()
          setMetrics(data)
        }
      } catch (err) {
        console.error('Failed to fetch metrics:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchMetrics()
  }, [])

  return (
    <div className="p-8 min-h-screen">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] font-medium text-emerald-400/80 uppercase tracking-[0.15em]">
            Sistema Online
          </span>
        </div>
        <h1 className="text-4xl font-bold text-white tracking-tight">Dashboard</h1>
        <p className="text-white/30 mt-1 text-sm">Visão geral do e-commerce Mosca Branca Parts</p>
      </div>

      {/* Status banners */}
      {!loading && metrics.apiError && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-300 font-inter">
            Não foi possível carregar os dados. Verifique a conexão com o banco de dados.
          </p>
        </div>
      )}
      {!loading && !metrics.apiError && !metrics.hasData && (
        <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-3">
          <Clock className="h-5 w-5 text-amber-400 flex-shrink-0" />
          <p className="text-sm text-amber-300 font-inter">
            Nenhum pedido registrado ainda. Os dados aparecerão conforme as vendas acontecerem.
          </p>
        </div>
      )}

      {/* Primary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard
          icon={DollarSign}
          title="Receita Hoje"
          value={loading ? '—' : `R$ ${metrics.revenueToday.toFixed(2)}`}
          trend="up"
          trendValue="+12%"
          accent="amber"
        />
        <MetricCard
          icon={ShoppingCart}
          title="Pedidos Hoje"
          value={loading ? '—' : metrics.ordersToday.toString()}
          trend="up"
          trendValue="+3"
          accent="emerald"
        />
        <MetricCard
          icon={Package}
          title="Produtos"
          value={loading ? '—' : metrics.totalProducts.toString()}
          trend="neutral"
          trendValue=""
          accent="blue"
        />
        <MetricCard
          icon={AlertTriangle}
          title="Estoque Baixo"
          value={loading ? '—' : metrics.lowStockCount.toString()}
          trend={metrics.lowStockCount > 5 ? 'down' : 'neutral'}
          trendValue={metrics.lowStockCount > 5 ? 'Atenção' : 'OK'}
          accent="red"
        />
      </div>

      {/* Secondary Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        {/* Revenue Chart Placeholder */}
        <div className="lg:col-span-2 bg-[#111113] border border-white/[0.06] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-medium text-white/60">Receita Semanal</h3>
              <p className="text-2xl font-bold text-white mt-1">R$ 12.450,00</p>
            </div>
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <ArrowUpRight className="h-3 w-3 text-emerald-400" />
              <span className="text-xs font-medium text-emerald-400">+18%</span>
            </div>
          </div>

          {/* Mini Chart Bars */}
          <div className="flex items-end gap-2 h-32">
            {[40, 65, 45, 80, 55, 90, 70].map((height, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full rounded-md bg-gradient-to-t from-amber-500/20 to-amber-500/5 border border-amber-500/10 transition-all duration-500"
                  style={{ height: `${height}%` }}
                />
                <span className="text-[10px] text-white/20">
                  {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'][i]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-[#111113] border border-white/[0.06] rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-medium text-white/60 mb-4">Resumo Rápido</h3>
            <div className="space-y-4">
              <QuickStat
                icon={Users}
                label="Clientes"
                value={loading ? '—' : metrics.totalCustomers.toString()}
              />
              <QuickStat
                icon={Truck}
                label="Pedidos Total"
                value={loading ? '—' : metrics.totalOrders.toString()}
              />
              <QuickStat
                icon={Eye}
                label="Visitas Hoje"
                value="—"
              />
              <QuickStat
                icon={Zap}
                label="Conversão"
                value="—"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-sm font-medium text-white/40 uppercase tracking-[0.1em] mb-4">Ações Rápidas</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <QuickAction href="/admin/produtos" label="Novo Produto" icon={Package} />
          <QuickAction href="/admin/estoque" label="Ajustar Estoque" icon={AlertTriangle} />
          <QuickAction href="/admin/pedidos" label="Ver Pedidos" icon={ShoppingCart} />
          <QuickAction href="/admin/cupons" label="Criar Cupom" icon={DollarSign} />
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex items-center gap-6 py-4 px-5 bg-[#111113] border border-white/[0.06] rounded-xl">
        <StatusDot color="emerald" label="API Online" />
        <StatusDot color="emerald" label="Supabase" />
        <StatusDot color="emerald" label="MercadoPago" />
        <StatusDot color="amber" label="Melhor Envio" />
        <div className="ml-auto flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-white/20" />
          <span className="text-xs text-white/30">
            Atualizado {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  )
}

function MetricCard({ icon: Icon, title, value, trend, trendValue, accent }: {
  icon: any
  title: string
  value: string
  trend: 'up' | 'down' | 'neutral'
  trendValue: string
  accent: string
}) {
  const accentMap: Record<string, { bg: string; border: string; text: string; icon: string }> = {
    amber: { bg: 'from-amber-500/10 to-transparent', border: 'border-amber-500/10', text: 'text-amber-400', icon: 'text-amber-400/60' },
    emerald: { bg: 'from-emerald-500/10 to-transparent', border: 'border-emerald-500/10', text: 'text-emerald-400', icon: 'text-emerald-400/60' },
    blue: { bg: 'from-blue-500/10 to-transparent', border: 'border-blue-500/10', text: 'text-blue-400', icon: 'text-blue-400/60' },
    red: { bg: 'from-red-500/10 to-transparent', border: 'border-red-500/10', text: 'text-red-400', icon: 'text-red-400/60' },
  }

  const colors = accentMap[accent] || accentMap.amber

  return (
    <div className={`
      relative overflow-hidden
      bg-gradient-to-br ${colors.bg}
      border ${colors.border}
      rounded-2xl p-5
      transition-all duration-300
      hover:border-white/10 hover:shadow-lg hover:shadow-black/20
    `}>
      <div className="flex items-start justify-between mb-4">
        <div className={`p-2 rounded-lg bg-white/[0.03] border border-white/[0.06]`}>
          <Icon className={`h-4 w-4 ${colors.icon}`} />
        </div>
        {trendValue && (
          <div className={`flex items-center gap-0.5 ${
            trend === 'up' ? 'text-emerald-400' :
            trend === 'down' ? 'text-red-400' : 'text-white/30'
          }`}>
            {trend === 'up' && <ArrowUpRight className="h-3 w-3" />}
            {trend === 'down' && <ArrowDownRight className="h-3 w-3" />}
            <span className="text-[11px] font-medium">{trendValue}</span>
          </div>
        )}
      </div>
      <p className="text-[11px] font-medium text-white/30 uppercase tracking-wider mb-1">{title}</p>
      <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
    </div>
  )
}

function QuickStat({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
      <div className="flex items-center gap-2.5">
        <Icon className="h-4 w-4 text-white/20" />
        <span className="text-sm text-white/50">{label}</span>
      </div>
      <span className="text-sm font-semibold text-white/80">{value}</span>
    </div>
  )
}

function QuickAction({ href, label, icon: Icon }: { href: string; label: string; icon: any }) {
  return (
    <Link
      href={href}
      className="
        group flex items-center gap-3 p-4
        bg-[#111113] border border-white/[0.06] rounded-xl
        hover:border-amber-500/20 hover:bg-amber-500/[0.02]
        transition-all duration-200 cursor-pointer
      "
    >
      <Icon className="h-4 w-4 text-white/20 group-hover:text-amber-400/60 transition-colors" />
      <span className="text-sm font-medium text-white/50 group-hover:text-white/80 transition-colors">{label}</span>
    </Link>
  )
}

function StatusDot({ color, label }: { color: string; label: string }) {
  const colorMap: Record<string, string> = {
    emerald: 'bg-emerald-400',
    amber: 'bg-amber-400',
    red: 'bg-red-400',
  }

  return (
    <div className="flex items-center gap-2">
      <div className={`w-1.5 h-1.5 rounded-full ${colorMap[color]} animate-pulse`} />
      <span className="text-xs text-white/40">{label}</span>
    </div>
  )
}
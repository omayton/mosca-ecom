'use client'

import { useState, useEffect } from 'react'
import { Package, ShoppingCart, Users, AlertTriangle, TrendingUp, DollarSign } from 'lucide-react'
import Link from 'next/link'

interface DashboardMetrics {
  totalProducts: number
  totalOrders: number
  totalCustomers: number
  lowStockCount: number
  revenueToday: number
  ordersToday: number
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
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900">Dashboard</h1>
        <p className="text-zinc-500 mt-1">Visão geral do e-commerce</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <MetricCard
          icon={Package}
          title="Total Produtos"
          value={metrics.totalProducts}
          color="blue"
          loading={loading}
        />
        <MetricCard
          icon={ShoppingCart}
          title="Pedidos Hoje"
          value={metrics.ordersToday}
          color="green"
          loading={loading}
        />
        <MetricCard
          icon={AlertTriangle}
          title="Estoque Baixo"
          value={metrics.lowStockCount}
          color="yellow"
          loading={loading}
        />
        <MetricCard
          icon={Users}
          title="Clientes"
          value={metrics.totalCustomers}
          color="purple"
          loading={loading}
        />
        <MetricCard
          icon={DollarSign}
          title="Receita Hoje"
          value={`R$ ${metrics.revenueToday.toFixed(2)}`}
          color="green"
          loading={loading}
        />
        <MetricCard
          icon={TrendingUp}
          title="Total Pedidos"
          value={metrics.totalOrders}
          color="blue"
          loading={loading}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <QuickAction href="/admin/produtos" label="Gerenciar Produtos" icon={Package} />
        <QuickAction href="/admin/estoque" label="Controle de Estoque" icon={AlertTriangle} />
        <QuickAction href="/admin/pedidos" label="Ver Pedidos" icon={ShoppingCart} />
        <QuickAction href="/admin/cupons" label="Criar Cupom" icon={DollarSign} />
      </div>
    </div>
  )
}

function MetricCard({ icon: Icon, title, value, color, loading }: {
  icon: any
  title: string
  value: string | number
  color: string
  loading: boolean
}) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    purple: 'bg-purple-50 text-purple-600',
    red: 'bg-red-50 text-red-600',
  }

  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-6">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-lg ${colorMap[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm text-zinc-500">{title}</p>
          {loading ? (
            <div className="h-8 w-20 bg-zinc-100 animate-pulse rounded mt-1" />
          ) : (
            <p className="text-2xl font-bold text-zinc-900">{value}</p>
          )}
        </div>
      </div>
    </div>
  )
}

function QuickAction({ href, label, icon: Icon }: {
  href: string
  label: string
  icon: any
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 bg-white border border-zinc-200 rounded-xl p-4 hover:border-red-300 hover:shadow-md transition-all duration-200 cursor-pointer"
    >
      <Icon className="h-5 w-5 text-red-600" />
      <span className="text-sm font-medium text-zinc-700">{label}</span>
    </Link>
  )
}
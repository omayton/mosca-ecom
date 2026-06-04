'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, ShoppingCart, DollarSign, BarChart3, Package, Layers } from 'lucide-react'

interface Summary {
  period: number
  totalOrders: number
  confirmedOrders: number
  cancelledOrders: number
  totalRevenue: number
  avgTicket: number
  conversionRate: string
  daily: { date: string; revenue: number; orders: number }[]
}

interface TopProduct {
  id: number
  name: string
  slug: string
  imageFile: string
  quantity: number
  revenue: number
}

interface CategoryData {
  name: string
  quantity: number
  revenue: number
}

function fmt(n: number): string {
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function AdminReportsPage() {
  const [period, setPeriod] = useState('30')
  const [summary, setSummary] = useState<Summary | null>(null)
  const [topProducts, setTopProducts] = useState<TopProduct[]>([])
  const [byCategory, setByCategory] = useState<CategoryData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAll() {
      setLoading(true)
      try {
        const [sumRes, topRes, catRes] = await Promise.all([
          fetch(`/api/admin/reports?period=${period}&type=summary`),
          fetch(`/api/admin/reports?period=${period}&type=top-products`),
          fetch(`/api/admin/reports?period=${period}&type=by-category`),
        ])
        if (sumRes.ok) setSummary(await sumRes.json())
        if (topRes.ok) {
          const data = await topRes.json()
          setTopProducts(data.topProducts || [])
        }
        if (catRes.ok) {
          const data = await catRes.json()
          setByCategory(data.byCategory || [])
        }
      } catch (err) {
        console.error('Failed to fetch reports:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [period])

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Relatórios de Vendas</h1>
          <p className="text-white/40 mt-1 text-sm">Análise de performance do e-commerce</p>
        </div>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="bg-[#111113] border border-white/[0.06] text-white text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-amber-500/50 cursor-pointer"
        >
          <option value="7">Últimos 7 dias</option>
          <option value="30">Últimos 30 dias</option>
          <option value="90">Últimos 90 dias</option>
          <option value="365">Último ano</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-white/40">Carregando relatórios...</div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-[#111113] border border-white/[0.06] rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-emerald-400" />
                </div>
                <span className="text-xs text-white/40 uppercase tracking-wider">Receita Total</span>
              </div>
              <p className="text-2xl font-bold text-white">R$ {fmt(summary?.totalRevenue || 0)}</p>
            </div>
            <div className="bg-[#111113] border border-white/[0.06] rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <ShoppingCart className="h-5 w-5 text-blue-400" />
                </div>
                <span className="text-xs text-white/40 uppercase tracking-wider">Pedidos</span>
              </div>
              <p className="text-2xl font-bold text-white">{summary?.confirmedOrders || 0}</p>
              <p className="text-xs text-white/30 mt-1">{summary?.totalOrders || 0} total ({summary?.cancelledOrders || 0} cancelados)</p>
            </div>
            <div className="bg-[#111113] border border-white/[0.06] rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-amber-400" />
                </div>
                <span className="text-xs text-white/40 uppercase tracking-wider">Ticket Médio</span>
              </div>
              <p className="text-2xl font-bold text-white">R$ {fmt(summary?.avgTicket || 0)}</p>
            </div>
            <div className="bg-[#111113] border border-white/[0.06] rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-purple-400" />
                </div>
                <span className="text-xs text-white/40 uppercase tracking-wider">Conversão</span>
              </div>
              <p className="text-2xl font-bold text-white">{summary?.conversionRate || '0'}%</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Products */}
            <div className="bg-[#111113] border border-white/[0.06] rounded-xl p-6">
              <div className="flex items-center gap-2 mb-5">
                <Package className="h-5 w-5 text-amber-400" />
                <h2 className="text-lg font-semibold text-white">Produtos Mais Vendidos</h2>
              </div>
              {topProducts.length === 0 ? (
                <p className="text-white/30 text-sm text-center py-8">Nenhuma venda no período</p>
              ) : (
                <div className="space-y-3">
                  {topProducts.map((p, i) => (
                    <div key={p.id} className="flex items-center gap-3 py-2 border-b border-white/[0.04] last:border-0">
                      <span className="text-xs text-white/30 w-5 text-right font-mono">{i + 1}.</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-medium truncate">{p.name}</p>
                        <p className="text-xs text-white/30">{p.quantity} unid.</p>
                      </div>
                      <span className="text-sm text-emerald-400 font-semibold">R$ {fmt(p.revenue)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* By Category */}
            <div className="bg-[#111113] border border-white/[0.06] rounded-xl p-6">
              <div className="flex items-center gap-2 mb-5">
                <Layers className="h-5 w-5 text-amber-400" />
                <h2 className="text-lg font-semibold text-white">Vendas por Categoria</h2>
              </div>
              {byCategory.length === 0 ? (
                <p className="text-white/30 text-sm text-center py-8">Nenhuma venda no período</p>
              ) : (
                <div className="space-y-3">
                  {byCategory.map((cat) => {
                    const maxRevenue = byCategory[0]?.revenue || 1
                    const pct = (cat.revenue / maxRevenue) * 100
                    return (
                      <div key={cat.name} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-white/80">{cat.name}</span>
                          <span className="text-sm text-emerald-400 font-semibold">R$ {fmt(cat.revenue)}</span>
                        </div>
                        <div className="h-2 bg-white/[0.04] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <p className="text-xs text-white/30">{cat.quantity} unidades vendidas</p>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Daily Chart (simple text-based) */}
          {summary?.daily && summary.daily.length > 0 && (
            <div className="mt-6 bg-[#111113] border border-white/[0.06] rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-5">Receita Diária</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      <th className="text-left text-xs text-white/40 font-medium uppercase tracking-wider px-3 py-2">Data</th>
                      <th className="text-right text-xs text-white/40 font-medium uppercase tracking-wider px-3 py-2">Pedidos</th>
                      <th className="text-right text-xs text-white/40 font-medium uppercase tracking-wider px-3 py-2">Receita</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.daily.slice(-14).map((day) => (
                      <tr key={day.date} className="border-b border-white/[0.04]">
                        <td className="px-3 py-2 text-sm text-white/70">
                          {new Date(day.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                        </td>
                        <td className="px-3 py-2 text-sm text-white/70 text-right">{day.orders}</td>
                        <td className="px-3 py-2 text-sm text-emerald-400 text-right font-medium">
                          {day.revenue > 0 ? `R$ ${fmt(day.revenue)}` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

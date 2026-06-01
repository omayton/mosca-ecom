'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, Package, Truck, CheckCircle, XCircle, Clock } from 'lucide-react'

interface Order {
  id: number
  user_id: string
  status: string
  total: number
  shipping_cost: number | null
  shipping_method: string | null
  payment_status: string | null
  payment_method: string | null
  created_at: string
  profiles: { name: string | null } | null
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(statusFilter && { status: statusFilter })
      })
      const res = await fetch(`/api/admin/orders?${params}`)
      if (res.ok) {
        const data = await res.json()
        setOrders(data.orders)
        setTotalPages(data.totalPages)
        setTotal(data.total)
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err)
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  const updateStatus = async (orderId: number, newStatus: string) => {
    try {
      await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, status: newStatus })
      })
      fetchOrders()
    } catch (err) {
      console.error('Status update failed:', err)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />
      case 'confirmed': return <CheckCircle className="h-4 w-4 text-blue-500" />
      case 'shipped': return <Truck className="h-4 w-4 text-purple-500" />
      case 'delivered': return <Package className="h-4 w-4 text-green-500" />
      case 'cancelled': return <XCircle className="h-4 w-4 text-red-500" />
      default: return <Clock className="h-4 w-4 text-zinc-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700',
      confirmed: 'bg-blue-100 text-blue-700',
      shipped: 'bg-purple-100 text-purple-700',
      delivered: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700'
    }
    const labels: Record<string, string> = {
      pending: 'Pendente',
      confirmed: 'Confirmado',
      shipped: 'Enviado',
      delivered: 'Entregue',
      cancelled: 'Cancelado'
    }
    return (
      <span className={`text-xs font-medium px-2 py-1 rounded-full ${styles[status] || 'bg-zinc-100 text-zinc-700'}`}>
        {labels[status] || status}
      </span>
    )
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900">Pedidos</h1>
          <p className="text-zinc-500 mt-1">{total} pedidos no total</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          className="px-4 py-2.5 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:border-red-300 cursor-pointer"
        >
          <option value="">Todos os status</option>
          <option value="pending">Pendente</option>
          <option value="confirmed">Confirmado</option>
          <option value="shipped">Enviado</option>
          <option value="delivered">Entregue</option>
          <option value="cancelled">Cancelado</option>
        </select>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase">Pedido</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase">Cliente</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-zinc-500 uppercase">Total</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-zinc-500 uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase">Data</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-zinc-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-4 py-4">
                      <div className="h-6 bg-zinc-100 animate-pulse rounded" />
                    </td>
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-zinc-500">
                    Nenhum pedido encontrado
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(order.status)}
                        <span className="font-medium text-zinc-900 text-sm">#{order.id}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-600">
                      {order.profiles?.name || 'Cliente'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <p className="font-medium text-zinc-900 text-sm">
                        R$ {parseFloat(String(order.total)).toFixed(2)}
                      </p>
                      {order.shipping_cost && (
                        <p className="text-xs text-zinc-400">
                          + R$ {parseFloat(String(order.shipping_cost)).toFixed(2)} frete
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-500">
                      {new Date(order.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <select
                        value={order.status}
                        onChange={(e) => updateStatus(order.id, e.target.value)}
                        className="text-xs border border-zinc-200 rounded px-2 py-1 focus:outline-none focus:border-red-300 cursor-pointer"
                      >
                        <option value="pending">Pendente</option>
                        <option value="confirmed">Confirmado</option>
                        <option value="shipped">Enviado</option>
                        <option value="delivered">Entregue</option>
                        <option value="cancelled">Cancelado</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-200">
            <p className="text-sm text-zinc-500">Página {page} de {totalPages}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm border border-zinc-200 rounded-lg disabled:opacity-50 hover:bg-zinc-50 cursor-pointer"
              >
                Anterior
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-sm border border-zinc-200 rounded-lg disabled:opacity-50 hover:bg-zinc-50 cursor-pointer"
              >
                Próxima
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
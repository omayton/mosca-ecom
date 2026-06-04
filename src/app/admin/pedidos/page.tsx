'use client'

import { useState, useEffect, useCallback } from 'react'
import { ShoppingCart, Clock, Truck, CheckCircle, XCircle, Package } from 'lucide-react'
import {
  AdminPage, AdminHeader, AdminFilter, AdminSelect, AdminTable,
  AdminTableRow, AdminTableCell, OrderStatusBadge, AdminEmptyState, AdminPagination
} from '@/components/admin/admin-ui'

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

function fmt(n: number) {
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
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

  const statusOptions = [
    { value: 'pending', label: 'Pendente' },
    { value: 'confirmed', label: 'Confirmado' },
    { value: 'shipped', label: 'Enviado' },
    { value: 'delivered', label: 'Entregue' },
    { value: 'cancelled', label: 'Cancelado' },
  ]

  return (
    <AdminPage>
      <AdminHeader title="Pedidos" count={total} />

      <AdminFilter>
        <AdminSelect
          value={statusFilter}
          onChange={(v) => { setStatusFilter(v); setPage(1) }}
          options={statusOptions}
          placeholder="Todos os status"
        />
      </AdminFilter>

      {!loading && orders.length === 0 ? (
        <AdminEmptyState
          icon={ShoppingCart}
          title="Nenhum pedido encontrado"
          description="Quando clientes finalizarem compras, os pedidos aparecerão aqui."
        />
      ) : (
        <AdminTable
          headers={[
            { label: 'Pedido', width: '100px' },
            { label: 'Cliente' },
            { label: 'Total', align: 'right' },
            { label: 'Status', align: 'center' },
            { label: 'Data' },
            { label: 'Ações', align: 'right' },
          ]}
          loading={loading}
        >
          {orders.map((order) => (
            <AdminTableRow key={order.id}>
              <AdminTableCell>
                <span className="font-semibold text-white">#{order.id}</span>
              </AdminTableCell>
              <AdminTableCell>
                <span className="text-white/60">{order.profiles?.name || 'Cliente'}</span>
              </AdminTableCell>
              <AdminTableCell align="right">
                <div>
                  <p className="font-semibold text-white">R$ {fmt(order.total)}</p>
                  {order.shipping_cost && (
                    <p className="text-[11px] text-white/30">+ R$ {fmt(order.shipping_cost)} frete</p>
                  )}
                </div>
              </AdminTableCell>
              <AdminTableCell align="center">
                <OrderStatusBadge status={order.status} />
              </AdminTableCell>
              <AdminTableCell>
                <span className="text-white/40 text-xs">
                  {new Date(order.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                </span>
              </AdminTableCell>
              <AdminTableCell align="right">
                <select
                  value={order.status}
                  onChange={(e) => updateStatus(order.id, e.target.value)}
                  className="text-xs bg-white/[0.04] border border-white/[0.06] text-white/60 rounded-md px-2 py-1.5 focus:outline-none focus:border-amber-500/30 cursor-pointer"
                >
                  {statusOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </AdminTableCell>
            </AdminTableRow>
          ))}
        </AdminTable>
      )}

      <AdminPagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </AdminPage>
  )
}

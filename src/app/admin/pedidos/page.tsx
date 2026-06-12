'use client'

import { useState, useEffect, useCallback } from 'react'
import { ShoppingCart, Eye } from 'lucide-react'
import {
  AdminPage, AdminHeader, AdminFilter, AdminSelect, AdminTable,
  AdminTableRow, AdminTableCell, OrderStatusBadge, AdminEmptyState, AdminPagination
} from '@/components/admin/admin-ui'
import { OrderDetailModal } from '@/components/admin/order-detail-modal'

interface Order {
  id: number
  user_id: string
  status: string
  total: number
  shipping_cost: number | null
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
  const [apiError, setApiError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null)

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    setApiError(null)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(statusFilter && { status: statusFilter }),
      })
      const res = await fetch(`/api/admin/orders?${params}`)
      const data = await res.json()
      if (!res.ok) {
        setApiError(`Erro ${res.status}: ${data.error || 'Falha ao buscar pedidos'}`)
        return
      }
      setOrders(data.orders)
      setTotalPages(data.totalPages)
      setTotal(data.total)
    } catch {
      setApiError('Erro de rede ao buscar pedidos')
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  const statusOptions = [
    { value: 'pending',   label: 'Pendente' },
    { value: 'confirmed', label: 'Confirmado' },
    { value: 'shipped',   label: 'Enviado' },
    { value: 'delivered', label: 'Entregue' },
    { value: 'cancelled', label: 'Cancelado' },
  ]

  return (
    <>
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

        {apiError ? (
          <div className="m-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-red-400 text-sm font-mono">{apiError}</p>
            <p className="text-white/40 text-xs mt-1">
              Verifique se a variável{' '}
              <code className="text-amber-400">ADMIN_EMAILS</code> no Vercel
              contém o email com que você está logado.
            </p>
          </div>
        ) : !loading && orders.length === 0 ? (
          <AdminEmptyState
            icon={ShoppingCart}
            title="Nenhum pedido encontrado"
            description="Quando clientes finalizarem compras, os pedidos aparecerão aqui."
          />
        ) : (
          <AdminTable
            headers={[
              { label: 'Pedido',  width: '90px' },
              { label: 'Cliente' },
              { label: 'Total',   align: 'right' },
              { label: 'Pagto',   align: 'center' },
              { label: 'Status',  align: 'center' },
              { label: 'Data' },
              { label: '',        width: '60px' },
            ]}
            loading={loading}
          >
            {orders.map((order) => (
              <AdminTableRow
                key={order.id}
                className="cursor-pointer hover:bg-white/[0.02] transition-colors"
                onClick={() => setSelectedOrderId(order.id)}
              >
                <AdminTableCell>
                  <span className="font-semibold text-white">#{order.id}</span>
                </AdminTableCell>

                <AdminTableCell>
                  <span className="text-white/80">
                    {order.profiles?.name || (
                      <span className="text-white/30 italic text-xs">sem nome</span>
                    )}
                  </span>
                </AdminTableCell>

                <AdminTableCell align="right">
                  <div>
                    <p className="font-semibold text-white">R$ {fmt(order.total)}</p>
                    {order.shipping_cost ? (
                      <p className="text-[11px] text-white/30">+ R$ {fmt(order.shipping_cost)} frete</p>
                    ) : null}
                  </div>
                </AdminTableCell>

                <AdminTableCell align="center">
                  <span className="text-white/50 text-xs capitalize">
                    {order.payment_method === 'pix' ? 'PIX' : order.payment_method || '—'}
                  </span>
                </AdminTableCell>

                <AdminTableCell align="center">
                  <OrderStatusBadge status={order.status} />
                </AdminTableCell>

                <AdminTableCell>
                  <span className="text-white/40 text-xs">
                    {new Date(order.created_at).toLocaleDateString('pt-BR', {
                      day: '2-digit', month: '2-digit', year: '2-digit',
                    })}
                  </span>
                </AdminTableCell>

                <AdminTableCell align="right">
                  <button
                    aria-label={`Ver pedido #${order.id}`}
                    onClick={(e) => { e.stopPropagation(); setSelectedOrderId(order.id) }}
                    className="flex items-center gap-1.5 text-amber-400/70 hover:text-amber-400 text-xs font-medium transition-colors cursor-pointer px-2 py-1"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Ver
                  </button>
                </AdminTableCell>
              </AdminTableRow>
            ))}
          </AdminTable>
        )}

        <AdminPagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </AdminPage>

      {/* Order detail modal */}
      <OrderDetailModal
        orderId={selectedOrderId}
        onClose={() => setSelectedOrderId(null)}
        onStatusChange={fetchOrders}
      />
    </>
  )
}

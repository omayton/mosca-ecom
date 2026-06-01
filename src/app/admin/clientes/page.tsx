'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, Users, ShoppingCart, MapPin } from 'lucide-react'

interface Customer {
  id: string
  name: string | null
  phone: string | null
  address_json: any
  created_at: string
  orders: { count: number }[]
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const fetchCustomers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(search && { search })
      })
      const res = await fetch(`/api/admin/customers?${params}`)
      if (res.ok) {
        const data = await res.json()
        setCustomers(data.customers)
        setTotalPages(data.totalPages)
        setTotal(data.total)
      }
    } catch (err) {
      console.error('Failed to fetch customers:', err)
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => { fetchCustomers() }, [fetchCustomers])

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900">Clientes</h1>
          <p className="text-zinc-500 mt-1">{total} clientes cadastrados</p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Buscar por nome ou telefone..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="w-full pl-10 pr-4 py-2.5 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:border-red-300"
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase">Cliente</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase">Telefone</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase">Endereço</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-zinc-500 uppercase">Pedidos</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase">Cadastro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={5} className="px-4 py-4">
                      <div className="h-6 bg-zinc-100 animate-pulse rounded" />
                    </td>
                  </tr>
                ))
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-zinc-500">
                    Nenhum cliente encontrado
                  </td>
                </tr>
              ) : (
                customers.map((customer) => {
                  const address = customer.address_json
                  const orderCount = customer.orders?.[0]?.count || 0

                  return (
                    <tr key={customer.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-red-100 rounded-full flex items-center justify-center">
                            <Users className="h-4 w-4 text-red-600" />
                          </div>
                          <div>
                            <p className="font-medium text-zinc-900 text-sm">
                              {customer.name || 'Sem nome'}
                            </p>
                            <p className="text-xs text-zinc-400">{customer.id.slice(0, 8)}...</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-600">
                        {customer.phone || '—'}
                      </td>
                      <td className="px-4 py-3">
                        {address ? (
                          <div className="flex items-center gap-1 text-sm text-zinc-600">
                            <MapPin className="h-3.5 w-3.5 text-zinc-400" />
                            <span className="line-clamp-1">
                              {address.city || address.cidade || '—'}, {address.state || address.estado || ''}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-zinc-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <ShoppingCart className="h-3.5 w-3.5 text-zinc-400" />
                          <span className="text-sm font-medium text-zinc-700">{orderCount}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-500">
                        {new Date(customer.created_at).toLocaleDateString('pt-BR')}
                      </td>
                    </tr>
                  )
                })
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
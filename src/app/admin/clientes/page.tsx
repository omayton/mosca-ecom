'use client'

import { useState, useEffect, useCallback } from 'react'
import { Users, ShoppingCart, MapPin } from 'lucide-react'
import {
  AdminPage, AdminHeader, AdminFilter, AdminTable,
  AdminTableRow, AdminTableCell, AdminEmptyState, AdminPagination
} from '@/components/admin/admin-ui'

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
    <AdminPage>
      <AdminHeader title="Clientes" count={total} />

      <AdminFilter
        searchValue={search}
        searchPlaceholder="Buscar por nome ou telefone..."
        onSearchChange={(v) => { setSearch(v); setPage(1) }}
      >
        {null}
      </AdminFilter>

      {!loading && customers.length === 0 ? (
        <AdminEmptyState
          icon={Users}
          title="Nenhum cliente encontrado"
          description="Clientes aparecerão aqui quando se registrarem."
        />
      ) : (
        <AdminTable
          headers={[
            { label: 'Cliente' },
            { label: 'Telefone' },
            { label: 'Endereço' },
            { label: 'Pedidos', align: 'center' },
            { label: 'Cadastro' },
          ]}
          loading={loading}
        >
          {customers.map((customer) => {
            const address = customer.address_json
            const orderCount = customer.orders?.[0]?.count || 0

            return (
              <AdminTableRow key={customer.id}>
                <AdminTableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-amber-500/10 rounded-full flex items-center justify-center">
                      <Users className="h-4 w-4 text-amber-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white text-sm">
                        {customer.name || 'Sem nome'}
                      </p>
                      <p className="text-[11px] text-white/20">{customer.id.slice(0, 8)}...</p>
                    </div>
                  </div>
                </AdminTableCell>
                <AdminTableCell>
                  <span className="text-white/50">{customer.phone || '—'}</span>
                </AdminTableCell>
                <AdminTableCell>
                  {address ? (
                    <div className="flex items-center gap-1 text-white/50">
                      <MapPin className="h-3.5 w-3.5 text-white/20" />
                      <span className="line-clamp-1 text-sm">
                        {address.city || address.cidade || '—'}, {address.state || address.estado || ''}
                      </span>
                    </div>
                  ) : (
                    <span className="text-white/20">—</span>
                  )}
                </AdminTableCell>
                <AdminTableCell align="center">
                  <div className="flex items-center justify-center gap-1">
                    <ShoppingCart className="h-3.5 w-3.5 text-white/20" />
                    <span className="text-sm font-medium text-white/70">{orderCount}</span>
                  </div>
                </AdminTableCell>
                <AdminTableCell>
                  <span className="text-white/40 text-xs">
                    {new Date(customer.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </AdminTableCell>
              </AdminTableRow>
            )
          })}
        </AdminTable>
      )}

      <AdminPagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </AdminPage>
  )
}

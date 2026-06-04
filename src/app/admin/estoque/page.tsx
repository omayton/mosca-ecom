'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, CheckCircle, XCircle, Package, RefreshCw, Boxes } from 'lucide-react'
import {
  AdminPage, AdminHeader, AdminCard, AdminTable, AdminTableRow,
  AdminTableCell, AdminBadge, AdminEmptyState, AdminButton
} from '@/components/admin/admin-ui'

interface StockProduct {
  id: number
  name: string
  category: string
  stock_quantity: number
  stock_threshold: number
  status: string
  in_stock: boolean
  image_file: string
}

export default function AdminStockPage() {
  const [products, setProducts] = useState<StockProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'low' | 'out'>('all')
  const [saving, setSaving] = useState<number | null>(null)

  const fetchStock = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/products?limit=100')
      if (res.ok) {
        const data = await res.json()
        setProducts(data.products)
      }
    } catch (err) {
      console.error('Failed to fetch stock:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchStock() }, [])

  const updateStock = async (id: number, quantity: number) => {
    setSaving(id)
    try {
      await fetch('/api/admin/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, stockQuantity: quantity })
      })
      setProducts(prev => prev.map(p =>
        p.id === id ? {
          ...p,
          stock_quantity: quantity,
          status: quantity === 0 ? 'out_of_stock' : quantity <= p.stock_threshold ? 'low_stock' : 'available',
          in_stock: quantity > 0
        } : p
      ))
    } catch (err) {
      console.error('Stock update failed:', err)
    } finally {
      setSaving(null)
    }
  }

  const filteredProducts = products.filter(p => {
    if (filter === 'low') return p.status === 'low_stock'
    if (filter === 'out') return p.status === 'out_of_stock'
    return true
  })

  const stats = {
    total: products.length,
    available: products.filter(p => p.status === 'available').length,
    lowStock: products.filter(p => p.status === 'low_stock').length,
    outOfStock: products.filter(p => p.status === 'out_of_stock').length,
  }

  return (
    <AdminPage>
      <AdminHeader title="Controle de Estoque" subtitle="Gerencie a quantidade de cada produto">
        <AdminButton variant="secondary" onClick={fetchStock}>
          <RefreshCw className="h-4 w-4" /> Atualizar
        </AdminButton>
      </AdminHeader>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <AdminCard>
          <div className="flex items-center gap-3">
            <Package className="h-7 w-7 text-blue-400/60" />
            <div>
              <p className="text-xl font-bold text-white">{stats.total}</p>
              <p className="text-[10px] text-white/30 uppercase tracking-wider">Total</p>
            </div>
          </div>
        </AdminCard>
        <AdminCard>
          <div className="flex items-center gap-3">
            <CheckCircle className="h-7 w-7 text-emerald-400/60" />
            <div>
              <p className="text-xl font-bold text-white">{stats.available}</p>
              <p className="text-[10px] text-white/30 uppercase tracking-wider">Disponível</p>
            </div>
          </div>
        </AdminCard>
        <AdminCard>
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-7 w-7 text-amber-400/60" />
            <div>
              <p className="text-xl font-bold text-amber-400">{stats.lowStock}</p>
              <p className="text-[10px] text-white/30 uppercase tracking-wider">Estoque Baixo</p>
            </div>
          </div>
        </AdminCard>
        <AdminCard>
          <div className="flex items-center gap-3">
            <XCircle className="h-7 w-7 text-red-400/60" />
            <div>
              <p className="text-xl font-bold text-red-400">{stats.outOfStock}</p>
              <p className="text-[10px] text-white/30 uppercase tracking-wider">Esgotado</p>
            </div>
          </div>
        </AdminCard>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {([
          { key: 'all', label: 'Todos' },
          { key: 'low', label: 'Estoque Baixo' },
          { key: 'out', label: 'Esgotados' },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              filter === tab.key
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'text-white/40 border border-white/[0.06] hover:text-white/70'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Stock Table */}
      {!loading && filteredProducts.length === 0 ? (
        <AdminEmptyState
          icon={Boxes}
          title="Nenhum produto encontrado"
          description="Nenhum produto corresponde ao filtro selecionado."
        />
      ) : (
        <AdminTable
          headers={[
            { label: 'Produto' },
            { label: 'Categoria' },
            { label: 'Quantidade', align: 'center' },
            { label: 'Alerta', align: 'center' },
            { label: 'Status', align: 'center' },
            { label: 'Ações Rápidas', align: 'center' },
          ]}
          loading={loading}
        >
          {filteredProducts.map((product) => (
            <AdminTableRow key={product.id}>
              <AdminTableCell>
                <p className="font-medium text-white text-sm line-clamp-1">{product.name}</p>
                <p className="text-[11px] text-white/20">#{product.id}</p>
              </AdminTableCell>
              <AdminTableCell>
                <span className="text-white/50 text-sm">{product.category}</span>
              </AdminTableCell>
              <AdminTableCell align="center">
                <input
                  type="number"
                  value={product.stock_quantity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0
                    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, stock_quantity: val } : p))
                  }}
                  onBlur={(e) => updateStock(product.id, parseInt(e.target.value) || 0)}
                  className="w-20 text-center bg-white/[0.04] border border-white/[0.06] rounded-md px-2 py-1.5 text-sm text-white focus:outline-none focus:border-amber-500/30"
                  min="0"
                />
              </AdminTableCell>
              <AdminTableCell align="center">
                <span className="text-white/30 text-sm">≤ {product.stock_threshold}</span>
              </AdminTableCell>
              <AdminTableCell align="center">
                <StockBadge status={product.status} />
              </AdminTableCell>
              <AdminTableCell align="center">
                <div className="flex items-center justify-center gap-1">
                  {[0, 5, 10, 50].map((qty) => (
                    <button
                      key={qty}
                      onClick={() => updateStock(product.id, qty)}
                      disabled={saving === product.id}
                      className={`px-2 py-1 text-xs rounded-md border transition-colors cursor-pointer ${
                        product.stock_quantity === qty
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                          : 'border-white/[0.06] text-white/40 hover:border-amber-500/20 hover:text-amber-400'
                      }`}
                    >
                      {qty}
                    </button>
                  ))}
                </div>
              </AdminTableCell>
            </AdminTableRow>
          ))}
        </AdminTable>
      )}
    </AdminPage>
  )
}

function StockBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'neutral' }> = {
    available: { label: 'Disponível', variant: 'success' },
    low_stock: { label: 'Baixo', variant: 'warning' },
    out_of_stock: { label: 'Esgotado', variant: 'error' },
    discontinued: { label: 'Descontinuado', variant: 'neutral' },
  }
  const item = map[status] || map.available
  return <AdminBadge label={item.label} variant={item.variant} />
}

'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, CheckCircle, XCircle, Package, RefreshCw } from 'lucide-react'

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
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900">Controle de Estoque</h1>
          <p className="text-zinc-500 mt-1">Gerencie a quantidade de cada produto</p>
        </div>
        <button
          onClick={fetchStock}
          className="flex items-center gap-2 px-4 py-2.5 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors cursor-pointer"
        >
          <RefreshCw className="h-4 w-4" />
          Atualizar
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-zinc-200 p-4 flex items-center gap-3">
          <Package className="h-8 w-8 text-blue-500" />
          <div>
            <p className="text-2xl font-bold text-zinc-900">{stats.total}</p>
            <p className="text-xs text-zinc-500">Total</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-green-200 p-4 flex items-center gap-3">
          <CheckCircle className="h-8 w-8 text-green-500" />
          <div>
            <p className="text-2xl font-bold text-zinc-900">{stats.available}</p>
            <p className="text-xs text-zinc-500">Disponível</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-yellow-200 p-4 flex items-center gap-3">
          <AlertTriangle className="h-8 w-8 text-yellow-500" />
          <div>
            <p className="text-2xl font-bold text-zinc-900">{stats.lowStock}</p>
            <p className="text-xs text-zinc-500">Estoque Baixo</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-red-200 p-4 flex items-center gap-3">
          <XCircle className="h-8 w-8 text-red-500" />
          <div>
            <p className="text-2xl font-bold text-zinc-900">{stats.outOfStock}</p>
            <p className="text-xs text-zinc-500">Esgotado</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { key: 'all', label: 'Todos' },
          { key: 'low', label: 'Estoque Baixo' },
          { key: 'out', label: 'Esgotados' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              filter === tab.key
                ? 'bg-red-600 text-white'
                : 'bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Stock Table */}
      <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase">Produto</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase">Categoria</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-zinc-500 uppercase">Quantidade</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-zinc-500 uppercase">Alerta</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-zinc-500 uppercase">Status</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-zinc-500 uppercase">Ações Rápidas</th>
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
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-zinc-500">
                    Nenhum produto encontrado
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-zinc-900 text-sm line-clamp-1">{product.name}</p>
                      <p className="text-xs text-zinc-400">#{product.id}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-600">{product.category}</td>
                    <td className="px-4 py-3 text-center">
                      <input
                        type="number"
                        value={product.stock_quantity}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0
                          setProducts(prev => prev.map(p => p.id === product.id ? { ...p, stock_quantity: val } : p))
                        }}
                        onBlur={(e) => updateStock(product.id, parseInt(e.target.value) || 0)}
                        className="w-20 text-center border border-zinc-200 rounded px-2 py-1 text-sm focus:outline-none focus:border-red-300"
                        min="0"
                      />
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-zinc-500">
                      ≤ {product.stock_threshold}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge status={product.status} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {[0, 5, 10, 50, 999].map((qty) => (
                          <button
                            key={qty}
                            onClick={() => updateStock(product.id, qty)}
                            disabled={saving === product.id}
                            className={`px-2 py-1 text-xs rounded border transition-colors cursor-pointer ${
                              product.stock_quantity === qty
                                ? 'bg-red-600 text-white border-red-600'
                                : 'border-zinc-200 text-zinc-600 hover:border-red-300'
                            }`}
                          >
                            {qty}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    available: 'bg-green-100 text-green-700',
    low_stock: 'bg-yellow-100 text-yellow-700',
    out_of_stock: 'bg-red-100 text-red-700',
    discontinued: 'bg-zinc-100 text-zinc-700'
  }
  const labels: Record<string, string> = {
    available: 'Disponível',
    low_stock: 'Baixo',
    out_of_stock: 'Esgotado',
    discontinued: 'Descontinuado'
  }
  return (
    <span className={`text-xs font-medium px-2 py-1 rounded-full ${styles[status] || styles.available}`}>
      {labels[status] || status}
    </span>
  )
}
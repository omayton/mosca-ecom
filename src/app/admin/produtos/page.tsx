'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, Edit2, Trash2, Image as ImageIcon, Package } from 'lucide-react'
import Link from 'next/link'
import { imgUrl } from '@/lib/products'
import { ImageUpload } from '@/components/admin/image-upload'
import { ProductImagesUpload } from '@/components/admin/product-images-upload'

interface Product {
  id: number
  slug: string
  name: string
  price: number
  old_price: number | null
  category: string
  category_slug: string
  image_file: string
  description: string
  weight: string | null
  dimensions: string | null
  in_stock: boolean
  featured: boolean
  stock_quantity: number
  stock_threshold: number
  status: string
  created_at: string
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [showForm, setShowForm] = useState(false)

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter })
      })
      const res = await fetch(`/api/admin/products?${params}`)
      if (res.ok) {
        const data = await res.json()
        setProducts(data.products)
        setTotalPages(data.totalPages)
        setTotal(data.total)
      }
    } catch (err) {
      console.error('Failed to fetch products:', err)
    } finally {
      setLoading(false)
    }
  }, [page, search, statusFilter])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return
    try {
      const res = await fetch(`/api/admin/products?id=${id}`, { method: 'DELETE' })
      if (res.ok) fetchProducts()
    } catch (err) {
      console.error('Delete failed:', err)
    }
  }

  const handleStockUpdate = async (id: number, quantity: number) => {
    try {
      await fetch('/api/admin/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, stockQuantity: quantity })
      })
      fetchProducts()
    } catch (err) {
      console.error('Stock update failed:', err)
    }
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      available: 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20',
      low_stock: 'text-amber-400 bg-amber-500/10 border border-amber-500/20',
      out_of_stock: 'text-red-400 bg-red-500/10 border border-red-500/20',
      discontinued: 'text-white/40 bg-white/5 border border-white/10'
    }
    const labels: Record<string, string> = {
      available: 'Disponível',
      low_stock: 'Estoque Baixo',
      out_of_stock: 'Esgotado',
      discontinued: 'Descontinuado'
    }
    return (
      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md ${styles[status] || styles.available}`}>
        {labels[status] || status}
      </span>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">Produtos</h1>
          <p className="text-white/30 mt-1 text-sm">{total} produtos cadastrados</p>
        </div>
        <button
          onClick={() => { setEditingProduct(null); setShowForm(true) }}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold px-4 py-2.5 rounded-lg transition-colors cursor-pointer"
        >
          <Plus className="h-5 w-5" />
          Novo Produto
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
          <input
            type="text"
            placeholder="Buscar produto..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="w-full pl-10 pr-4 py-2.5 bg-[#111113] border border-white/[0.06] rounded-lg text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-amber-500/30"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          className="px-4 py-2.5 bg-[#111113] border border-white/[0.06] rounded-lg text-sm text-white/80 focus:outline-none focus:border-amber-500/30 cursor-pointer"
        >
          <option value="">Todos os status</option>
          <option value="available">Disponível</option>
          <option value="low_stock">Estoque Baixo</option>
          <option value="out_of_stock">Esgotado</option>
          <option value="discontinued">Descontinuado</option>
        </select>
      </div>

      {/* Products Table */}
      <div className="bg-[#111113] border border-white/[0.06] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-white/[0.06]">
              <tr>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-wider">Produto</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-wider">Categoria</th>
                <th className="text-right px-4 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-wider">Preço</th>
                <th className="text-center px-4 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-wider">Estoque</th>
                <th className="text-center px-4 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-wider">Status</th>
                <th className="text-right px-4 py-3 text-[10px] font-semibold text-white/30 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-4 py-3.5">
                      <div className="h-4 bg-white/[0.04] animate-pulse rounded w-3/4" />
                    </td>
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-white/30">
                    Nenhum produto encontrado
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/[0.04] rounded-lg flex items-center justify-center overflow-hidden">
                          {product.image_file && product.image_file !== 'placeholder' ? (
                            <img
                              src={imgUrl(product.image_file)}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ImageIcon className="h-5 w-5 text-white/20" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-white text-sm line-clamp-1">{product.name}</p>
                          <p className="text-[11px] text-white/20">#{product.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-white/50">{product.category}</td>
                    <td className="px-4 py-3 text-right">
                      <p className="font-semibold text-white text-sm">
                        R$ {parseFloat(String(product.price)).toFixed(2)}
                      </p>
                      {product.old_price && (
                        <p className="text-xs text-white/30 line-through">
                          R$ {parseFloat(String(product.old_price)).toFixed(2)}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input
                        type="number"
                        value={product.stock_quantity}
                        onChange={(e) => handleStockUpdate(product.id, parseInt(e.target.value) || 0)}
                        className="w-16 text-center bg-white/[0.04] border border-white/[0.06] rounded-md px-2 py-1 text-sm text-white focus:outline-none focus:border-amber-500/30"
                        min="0"
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      {getStatusBadge(product.status)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => { setEditingProduct(product); setShowForm(true) }}
                          className="p-2 text-white/30 hover:text-amber-400 transition-colors cursor-pointer"
                          title="Editar"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="p-2 text-white/30 hover:text-red-400 transition-colors cursor-pointer"
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.06]">
            <p className="text-sm text-white/30">
              Página {page} de {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm border border-white/[0.06] text-white/40 rounded-lg disabled:opacity-30 hover:bg-white/[0.04] cursor-pointer"
              >
                Anterior
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-sm border border-white/[0.06] text-white/40 rounded-lg disabled:opacity-30 hover:bg-white/[0.04] cursor-pointer"
              >
                Próxima
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Product Form Modal */}
      {showForm && (
        <ProductFormModal
          product={editingProduct}
          onClose={() => setShowForm(false)}
          onSave={() => { setShowForm(false); fetchProducts() }}
        />
      )}
    </div>
  )
}

function ProductFormModal({ product, onClose, onSave }: {
  product: Product | null
  onClose: () => void
  onSave: () => void
}) {
  const [form, setForm] = useState({
    name: product?.name || '',
    slug: product?.slug || '',
    price: product?.price?.toString() || '',
    oldPrice: product?.old_price?.toString() || '',
    category: product?.category || '',
    categorySlug: product?.category_slug || '',
    description: product?.description || '',
    weight: product?.weight || '',
    dimensions: product?.dimensions || '',
    featured: product?.featured || false,
    stockQuantity: product?.stock_quantity?.toString() || '999',
    stockThreshold: product?.stock_threshold?.toString() || '10',
  })
  const [images, setImages] = useState<{ id: number; url: string; altText: string; sortOrder: number }[]>([])
  const [imagesLoaded, setImagesLoaded] = useState(false)
  const [saving, setSaving] = useState(false)

  // Carregar imagens do produto ao abrir o modal
  useEffect(() => {
    if (product?.id) {
      fetch(`/api/admin/product-images?productId=${product.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.images) {
            setImages(data.images)
          }
          setImagesLoaded(true)
        })
        .catch((err) => {
          console.error('Erro ao carregar imagens:', err)
          setImagesLoaded(true)
        })
    } else {
      setImagesLoaded(true)
    }
  }, [product])

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const payload = {
        ...(product && { id: product.id }),
        name: form.name,
        slug: form.slug || generateSlug(form.name),
        price: parseFloat(form.price),
        oldPrice: form.oldPrice ? parseFloat(form.oldPrice) : null,
        category: form.category,
        categorySlug: form.categorySlug || generateSlug(form.category),
        description: form.description,
        weight: form.weight || null,
        dimensions: form.dimensions || null,
        featured: form.featured,
        stockQuantity: parseInt(form.stockQuantity) || 999,
        stockThreshold: parseInt(form.stockThreshold) || 10,
      }

      const res = await fetch('/api/admin/products', {
        method: product ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        onSave()
      } else {
        const err = await res.json()
        alert(err.error || 'Erro ao salvar produto')
      }
    } catch (err) {
      alert('Erro de conexão')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4 p-6">
        <h2 className="text-xl font-bold text-zinc-900 mb-6">
          {product ? 'Editar Produto' : 'Novo Produto'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-zinc-700 mb-1">Nome</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value, slug: generateSlug(e.target.value) })}
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:border-red-300"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Slug</label>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:border-red-300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Categoria</label>
              <input
                type="text"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value, categorySlug: generateSlug(e.target.value) })}
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:border-red-300"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Preço (R$)</label>
              <input
                type="number"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:border-red-300"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Preço Antigo (R$)</label>
              <input
                type="number"
                step="0.01"
                value={form.oldPrice}
                onChange={(e) => setForm({ ...form, oldPrice: e.target.value })}
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:border-red-300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Estoque</label>
              <input
                type="number"
                value={form.stockQuantity}
                onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })}
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:border-red-300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Alerta Estoque Baixo</label>
              <input
                type="number"
                value={form.stockThreshold}
                onChange={(e) => setForm({ ...form, stockThreshold: e.target.value })}
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:border-red-300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Peso</label>
              <input
                type="text"
                value={form.weight}
                onChange={(e) => setForm({ ...form, weight: e.target.value })}
                placeholder="0,5 kg"
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:border-red-300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Dimensões</label>
              <input
                type="text"
                value={form.dimensions}
                onChange={(e) => setForm({ ...form, dimensions: e.target.value })}
                placeholder="30×20×15 cm"
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:border-red-300"
              />
            </div>

            <div className="md:col-span-2">
              {imagesLoaded ? (
                <ProductImagesUpload
                  productId={product?.id || 0}
                  images={images}
                  onChange={setImages}
                />
              ) : (
                <div className="text-center py-8 text-zinc-500">Carregando imagens...</div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="featured"
                checked={form.featured}
                onChange={(e) => setForm({ ...form, featured: e.target.checked })}
                className="rounded border-zinc-300"
              />
              <label htmlFor="featured" className="text-sm text-zinc-700">Produto Destaque</label>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-zinc-700 mb-1">Descrição</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:border-red-300 resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-zinc-700 border border-zinc-200 rounded-lg hover:bg-zinc-50 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 cursor-pointer"
            >
              {saving ? 'Salvando...' : (product ? 'Salvar Alterações' : 'Criar Produto')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
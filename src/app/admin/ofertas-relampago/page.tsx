'use client'

import { useState, useEffect, useCallback } from 'react'
import { Zap, Plus, Edit2, Trash2, Clock, Play, Pause, Loader2, Search } from 'lucide-react'
import {
  AdminPage, AdminHeader, AdminCard, AdminBadge,
  AdminEmptyState, AdminButton, AdminModal, AdminInput, AdminTextarea,
} from '@/components/admin/admin-ui'
import { fmt } from '@/lib/products'

interface FlashSale {
  id: number
  title: string
  description: string | null
  starts_at: string
  ends_at: string
  discount_percent: number
  is_active: boolean
  productCount?: number
  productIds?: number[]
}

interface ProductOpt { id: number; name: string; price: number }

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
  } catch {
    return iso
  }
}

// datetime-local espera valor no formato yyyy-MM-ddTHH:mm (local)
function toLocalInput(iso: string) {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  } catch {
    return ''
  }
}
function fromLocalInput(local: string) {
  if (!local) return null
  return new Date(local).toISOString()
}

function getStatus(s: FlashSale, now: number): { label: string; variant: 'success' | 'warning' | 'neutral' | 'info' } {
  if (!s.is_active) return { label: 'Pausada', variant: 'neutral' }
  const start = new Date(s.starts_at).getTime()
  const end = new Date(s.ends_at).getTime()
  if (now < start) return { label: 'Agendada', variant: 'info' }
  if (now > end) return { label: 'Encerrada', variant: 'neutral' }
  return { label: 'Ativa agora', variant: 'success' }
}

export default function FlashSalesPage() {
  const [sales, setSales] = useState<FlashSale[]>([])
  const [products, setProducts] = useState<ProductOpt[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<FlashSale | null>(null)
  const [now, setNow] = useState(Date.now())

  const fetchSales = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/flash-sales')
      if (res.ok) {
        const data = await res.json()
        setSales(data.flashSales || [])
      }
    } catch (e) {
      console.error('Failed to fetch flash sales:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/products?limit=1000')
      if (res.ok) {
        const data = await res.json()
        setProducts((data.products || []).map((p: any) => ({ id: p.id, name: p.name, price: p.price })))
      }
    } catch (e) {
      console.error('Failed to fetch products:', e)
    }
  }, [])

  useEffect(() => {
    fetchSales()
    fetchProducts()
    const t = setInterval(() => setNow(Date.now()), 30000)
    return () => clearInterval(t)
  }, [fetchSales, fetchProducts])

  const toggleActive = async (s: FlashSale) => {
    await fetch('/api/admin/flash-sales', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: s.id, isActive: !s.is_active }),
    })
    fetchSales()
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Excluir esta oferta relâmpago?')) return
    await fetch(`/api/admin/flash-sales?id=${id}`, { method: 'DELETE' })
    fetchSales()
  }

  const openEdit = async (s: FlashSale) => {
    // Busca detalhe com productIds
    const res = await fetch(`/api/admin/flash-sales?id=${s.id}`)
    if (res.ok) {
      const data = await res.json()
      setEditing(data.flashSale)
      setShowForm(true)
    }
  }

  return (
    <AdminPage>
      <AdminHeader title="Ofertas Relâmpago" subtitle={loading ? 'Carregando...' : `${sales.length} campanha(s)`}>
        <AdminButton onClick={() => { setEditing(null); setShowForm(true) }}>
          <Plus className="h-4 w-4" /> Nova Oferta
        </AdminButton>
      </AdminHeader>

      {/* Info */}
      <div className="mx-6 mb-6 p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
        <p className="text-amber-400/90 text-sm font-medium mb-1 flex items-center gap-2"><Zap className="h-4 w-4" /> Como funciona</p>
        <p className="text-white/40 text-xs leading-relaxed">
          Crie uma campanha com % de desconto, janela de início/fim e os produtos participantes.
          Quando ativa e dentro da janela, o desconto aparece automaticamente nos cards, na página do produto, no carrinho e no checkout — além de um <strong className="text-white/60">banner com contagem regressiva</strong> na home.
        </p>
      </div>

      {loading ? (
        <div className="space-y-3 px-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 bg-white/[0.02] animate-pulse rounded-xl" />
          ))}
        </div>
      ) : sales.length === 0 ? (
        <AdminEmptyState
          icon={Zap}
          title="Nenhuma oferta relâmpago"
          description="Crie a primeira campanha para gerar urgência e aumentar conversão."
        />
      ) : (
        <div className="space-y-3">
          {sales.map((s) => {
            const status = getStatus(s, now)
            return (
              <AdminCard key={s.id}>
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                      <Zap className="h-5 w-5 text-amber-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-white truncate">{s.title}</p>
                        <AdminBadge label={status.label} variant={status.variant} />
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-white/40 mt-1">
                        <span className="text-amber-400 font-bold">{Number(s.discount_percent)}% OFF</span>
                        <span>{s.productCount || 0} produto(s)</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {fmtDate(s.starts_at)} → {fmtDate(s.ends_at)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleActive(s)}
                      title={s.is_active ? 'Pausar' : 'Ativar'}
                      className="p-2 text-white/30 hover:text-amber-400 transition-colors cursor-pointer"
                    >
                      {s.is_active ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => openEdit(s)}
                      className="p-2 text-white/30 hover:text-blue-400 transition-colors cursor-pointer"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(s.id)}
                      className="p-2 text-white/30 hover:text-red-400 transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </AdminCard>
            )
          })}
        </div>
      )}

      {showForm && (
        <FlashSaleForm
          editing={editing}
          products={products}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); fetchSales() }}
        />
      )}
    </AdminPage>
  )
}

function FlashSaleForm({ editing, products, onClose, onSaved }: {
  editing: FlashSale | null
  products: ProductOpt[]
  onClose: () => void
  onSaved: () => void
}) {
  const [title, setTitle] = useState(editing?.title || '')
  const [description, setDescription] = useState(editing?.description || '')
  const [discount, setDiscount] = useState(editing ? String(editing.discount_percent) : '15')
  const [startsAt, setStartsAt] = useState(editing ? toLocalInput(editing.starts_at) : '')
  const [endsAt, setEndsAt] = useState(editing ? toLocalInput(editing.ends_at) : '')
  const [selected, setSelected] = useState<Set<number>>(new Set(editing?.productIds || []))
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const toggle = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const filtered = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))

  async function save() {
    setError('')
    if (!title.trim()) { setError('Título obrigatório.'); return }
    if (!startsAt || !endsAt) { setError('Início e fim são obrigatórios.'); return }
    const startIso = fromLocalInput(startsAt)!
    const endIso = fromLocalInput(endsAt)!
    if (new Date(endIso) <= new Date(startIso)) { setError('O fim deve ser depois do início.'); return }
    if (selected.size === 0) { setError('Selecione ao menos um produto.'); return }

    setSaving(true)
    try {
      const method = editing ? 'PATCH' : 'POST'
      const body: any = {
        title, description,
        discountPercent: Number(discount),
        startsAt: startIso,
        endsAt: endIso,
        productIds: Array.from(selected),
      }
      if (editing) body.id = editing.id

      const res = await fetch('/api/admin/flash-sales', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Erro ao salvar.'); return }
      onSaved()
    } catch {
      setError('Erro de conexão.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminModal open onClose={onClose} title={editing ? 'Editar Oferta Relâmpago' : 'Nova Oferta Relâmpago'} wide>
      <div className="space-y-4">
        <AdminInput label="Título" value={title} onChange={setTitle} placeholder="Ex: Sextão Mosca — 24h só" required />
        <AdminTextarea label="Descrição (opcional)" value={description} onChange={setDescription} placeholder="Aparece no banner da oferta" rows={2} />

        <div className="grid grid-cols-3 gap-3">
          <AdminInput label="Desconto (%)" type="number" value={discount} onChange={setDiscount} placeholder="15" required />
          <AdminInput label="Início" type="datetime-local" value={startsAt} onChange={setStartsAt} required />
          <AdminInput label="Fim" type="datetime-local" value={endsAt} onChange={setEndsAt} required />
        </div>

        {/* Product picker */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-white/40 uppercase tracking-widest">
              Produtos participantes <span className="text-amber-400">({selected.size})</span>
            </p>
            <button
              onClick={() => setSelected(new Set(filtered.map((p) => p.id)))}
              className="text-xs text-amber-400/80 hover:text-amber-400 cursor-pointer"
            >
              Selecionar todos
            </button>
          </div>
          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar produto..."
              className="w-full bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/20 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-amber-500/50"
            />
          </div>
          <div className="max-h-64 overflow-y-auto bg-white/[0.02] border border-white/[0.06] rounded-lg divide-y divide-white/[0.04]">
            {filtered.map((p) => (
              <label
                key={p.id}
                className="flex items-center gap-3 px-3 py-2 hover:bg-white/[0.03] cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selected.has(p.id)}
                  onChange={() => toggle(p.id)}
                  className="h-4 w-4 accent-amber-500"
                />
                <span className="text-sm text-white/70 flex-1 truncate">{p.name}</span>
                <span className="text-xs text-white/30">R$ {fmt(p.price)}</span>
              </label>
            ))}
            {filtered.length === 0 && (
              <p className="text-sm text-white/30 text-center py-4">Nenhum produto encontrado.</p>
            )}
          </div>
        </div>

        {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <AdminButton variant="ghost" onClick={onClose}>Cancelar</AdminButton>
          <AdminButton onClick={save} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {editing ? 'Salvar alterações' : 'Criar oferta'}
          </AdminButton>
        </div>
      </div>
    </AdminModal>
  )
}

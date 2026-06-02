'use client'

import { useState, useEffect } from 'react'
import { Plus, Tag, Trash2, Edit2, ToggleLeft, ToggleRight } from 'lucide-react'

interface Coupon {
  id: number
  code: string
  description: string
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  min_order_value: number
  max_uses: number | null
  used_count: number
  max_uses_per_user: number
  starts_at: string
  expires_at: string | null
  is_active: boolean
  applies_to: string
  show_on_product: boolean
  created_at: string
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null)

  const fetchCoupons = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/coupons')
      if (res.ok) {
        const data = await res.json()
        setCoupons(data.coupons)
      }
    } catch (err) {
      console.error('Failed to fetch coupons:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCoupons() }, [])

  const toggleActive = async (coupon: Coupon) => {
    try {
      await fetch('/api/admin/coupons', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: coupon.id, isActive: !coupon.is_active })
      })
      fetchCoupons()
    } catch (err) {
      console.error('Toggle failed:', err)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este cupom?')) return
    try {
      await fetch(`/api/admin/coupons?id=${id}`, { method: 'DELETE' })
      fetchCoupons()
    } catch (err) {
      console.error('Delete failed:', err)
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900">Cupons de Desconto</h1>
          <p className="text-zinc-500 mt-1">{coupons.length} cupons cadastrados</p>
        </div>
        <button
          onClick={() => { setEditingCoupon(null); setShowForm(true) }}
          className="flex items-center gap-2 bg-red-600 text-white px-4 py-2.5 rounded-lg hover:bg-red-700 transition-colors cursor-pointer"
        >
          <Plus className="h-5 w-5" />
          Novo Cupom
        </button>
      </div>

      {/* Coupons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-zinc-200 p-6 animate-pulse">
              <div className="h-6 bg-zinc-100 rounded w-1/2 mb-4" />
              <div className="h-4 bg-zinc-100 rounded w-3/4" />
            </div>
          ))
        ) : coupons.length === 0 ? (
          <div className="col-span-full text-center py-12 text-zinc-500">
            Nenhum cupom cadastrado
          </div>
        ) : (
          coupons.map((coupon) => (
            <div
              key={coupon.id}
              className={`bg-white rounded-xl border-2 p-6 transition-colors ${
                coupon.is_active ? 'border-green-200' : 'border-zinc-200 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Tag className="h-5 w-5 text-red-500" />
                  <code className="text-lg font-bold text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded">
                    {coupon.code}
                  </code>
                </div>
                <button
                  onClick={() => toggleActive(coupon)}
                  className="cursor-pointer"
                  title={coupon.is_active ? 'Desativar' : 'Ativar'}
                >
                  {coupon.is_active ? (
                    <ToggleRight className="h-6 w-6 text-green-500" />
                  ) : (
                    <ToggleLeft className="h-6 w-6 text-zinc-400" />
                  )}
                </button>
              </div>

              <p className="text-sm text-zinc-600 mb-3">{coupon.description || 'Sem descrição'}</p>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Desconto:</span>
                  <span className="font-medium text-zinc-900">
                    {coupon.discount_type === 'percentage'
                      ? `${coupon.discount_value}%`
                      : `R$ ${parseFloat(String(coupon.discount_value)).toFixed(2)}`
                    }
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Pedido mínimo:</span>
                  <span className="text-zinc-700">R$ {parseFloat(String(coupon.min_order_value)).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Usos:</span>
                  <span className="text-zinc-700">
                    {coupon.used_count}/{coupon.max_uses || '∞'}
                  </span>
                </div>
                {coupon.expires_at && (
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Expira:</span>
                    <span className="text-zinc-700">
                      {new Date(coupon.expires_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-3 border-t border-zinc-100">
                <button
                  onClick={() => { setEditingCoupon(coupon); setShowForm(true) }}
                  className="flex-1 flex items-center justify-center gap-1 py-2 text-sm text-zinc-600 hover:text-blue-600 border border-zinc-200 rounded-lg hover:border-blue-200 transition-colors cursor-pointer"
                >
                  <Edit2 className="h-3.5 w-3.5" /> Editar
                </button>
                <button
                  onClick={() => handleDelete(coupon.id)}
                  className="flex-1 flex items-center justify-center gap-1 py-2 text-sm text-zinc-600 hover:text-red-600 border border-zinc-200 rounded-lg hover:border-red-200 transition-colors cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Excluir
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Coupon Form Modal */}
      {showForm && (
        <CouponFormModal
          coupon={editingCoupon}
          onClose={() => setShowForm(false)}
          onSave={() => { setShowForm(false); fetchCoupons() }}
        />
      )}
    </div>
  )
}

function CouponFormModal({ coupon, onClose, onSave }: {
  coupon: Coupon | null
  onClose: () => void
  onSave: () => void
}) {
  const [form, setForm] = useState({
    code: coupon?.code || '',
    description: coupon?.description || '',
    discountType: coupon?.discount_type || 'percentage',
    discountValue: coupon?.discount_value?.toString() || '',
    minOrderValue: coupon?.min_order_value?.toString() || '0',
    maxUses: coupon?.max_uses?.toString() || '',
    maxUsesPerUser: coupon?.max_uses_per_user?.toString() || '1',
    expiresAt: coupon?.expires_at ? coupon.expires_at.split('T')[0] : '',
    showOnProduct: coupon?.show_on_product || false,
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const payload = {
        ...(coupon && { id: coupon.id }),
        code: form.code,
        description: form.description,
        discountType: form.discountType,
        discountValue: parseFloat(form.discountValue),
        minOrderValue: parseFloat(form.minOrderValue) || 0,
        maxUses: form.maxUses ? parseInt(form.maxUses) : null,
        maxUsesPerUser: parseInt(form.maxUsesPerUser) || 1,
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
        showOnProduct: form.showOnProduct,
      }

      const res = await fetch('/api/admin/coupons', {
        method: coupon ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        onSave()
      } else {
        const err = await res.json()
        alert(err.error || 'Erro ao salvar cupom')
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
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6">
        <h2 className="text-xl font-bold text-zinc-900 mb-6">
          {coupon ? 'Editar Cupom' : 'Novo Cupom'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Código</label>
            <input
              type="text"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              placeholder="DESCONTO10"
              className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm uppercase focus:outline-none focus:border-red-300"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Descrição</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="10% de desconto na primeira compra"
              className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:border-red-300"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Tipo</label>
              <select
                value={form.discountType}
                onChange={(e) => setForm({ ...form, discountType: e.target.value as 'percentage' | 'fixed' })}
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:border-red-300 cursor-pointer"
              >
                <option value="percentage">Porcentagem (%)</option>
                <option value="fixed">Valor Fixo (R$)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Valor</label>
              <input
                type="number"
                step="0.01"
                value={form.discountValue}
                onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                placeholder={form.discountType === 'percentage' ? '10' : '25.00'}
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:border-red-300"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Pedido Mínimo (R$)</label>
              <input
                type="number"
                step="0.01"
                value={form.minOrderValue}
                onChange={(e) => setForm({ ...form, minOrderValue: e.target.value })}
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:border-red-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Máx. Usos Total</label>
              <input
                type="number"
                value={form.maxUses}
                onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
                placeholder="Ilimitado"
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:border-red-300"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Usos por Usuário</label>
              <input
                type="number"
                value={form.maxUsesPerUser}
                onChange={(e) => setForm({ ...form, maxUsesPerUser: e.target.value })}
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:border-red-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Expira em</label>
              <input
                type="date"
                value={form.expiresAt}
                onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:border-red-300"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setForm({ ...form, showOnProduct: !form.showOnProduct })}
              className="cursor-pointer"
              aria-pressed={form.showOnProduct}
            >
              {form.showOnProduct ? (
                <ToggleRight className="h-6 w-6 text-emerald-500" />
              ) : (
                <ToggleLeft className="h-6 w-6 text-zinc-400" />
              )}
            </button>
            <span className="text-sm text-zinc-700">Exibir na página do produto</span>
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
              {saving ? 'Salvando...' : (coupon ? 'Salvar' : 'Criar Cupom')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { Plus, Tag, Trash2, Edit2, ToggleLeft, ToggleRight } from 'lucide-react'
import {
  AdminPage, AdminHeader, AdminCard, AdminButton, AdminEmptyState, AdminModal
} from '@/components/admin/admin-ui'

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
    <AdminPage>
      <AdminHeader title="Cupons de Desconto" subtitle={`${coupons.length} cupons cadastrados`}>
        <AdminButton onClick={() => { setEditingCoupon(null); setShowForm(true) }}>
          <Plus className="h-4 w-4" />
          Novo Cupom
        </AdminButton>
      </AdminHeader>

      {/* Coupons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <AdminCard key={i}>
              <div className="h-6 bg-white/[0.04] rounded w-1/2 mb-4 animate-pulse" />
              <div className="h-4 bg-white/[0.04] rounded w-3/4 animate-pulse" />
            </AdminCard>
          ))
        ) : coupons.length === 0 ? (
          <div className="col-span-full">
            <AdminEmptyState
              icon={Tag}
              title="Nenhum cupom cadastrado"
              description="Crie cupons para oferecer descontos aos clientes."
              action={
                <AdminButton onClick={() => { setEditingCoupon(null); setShowForm(true) }}>
                  <Plus className="h-4 w-4" /> Criar Cupom
                </AdminButton>
              }
            />
          </div>
        ) : (
          coupons.map((coupon) => (
            <AdminCard
              key={coupon.id}
              className={!coupon.is_active ? 'opacity-50' : ''}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-amber-400" />
                  <code className="text-base font-bold text-white bg-white/[0.06] px-2 py-0.5 rounded">
                    {coupon.code}
                  </code>
                </div>
                <button
                  onClick={() => toggleActive(coupon)}
                  className="cursor-pointer"
                  title={coupon.is_active ? 'Desativar' : 'Ativar'}
                >
                  {coupon.is_active ? (
                    <ToggleRight className="h-6 w-6 text-emerald-400" />
                  ) : (
                    <ToggleLeft className="h-6 w-6 text-white/20" />
                  )}
                </button>
              </div>

              <p className="text-sm text-white/40 mb-3">{coupon.description || 'Sem descrição'}</p>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-white/30">Desconto:</span>
                  <span className="font-medium text-amber-400">
                    {coupon.discount_type === 'percentage'
                      ? `${coupon.discount_value}%`
                      : `R$ ${parseFloat(String(coupon.discount_value)).toFixed(2)}`
                    }
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/30">Pedido mínimo:</span>
                  <span className="text-white/60">R$ {parseFloat(String(coupon.min_order_value)).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/30">Usos:</span>
                  <span className="text-white/60">
                    {coupon.used_count}/{coupon.max_uses || '∞'}
                  </span>
                </div>
                {coupon.expires_at && (
                  <div className="flex justify-between text-sm">
                    <span className="text-white/30">Expira:</span>
                    <span className="text-white/60">
                      {new Date(coupon.expires_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-3 border-t border-white/[0.06]">
                <button
                  onClick={() => { setEditingCoupon(coupon); setShowForm(true) }}
                  className="flex-1 flex items-center justify-center gap-1 py-2 text-sm text-white/40 hover:text-amber-400 border border-white/[0.06] rounded-lg hover:border-amber-500/20 transition-colors cursor-pointer"
                >
                  <Edit2 className="h-3.5 w-3.5" /> Editar
                </button>
                <button
                  onClick={() => handleDelete(coupon.id)}
                  className="flex-1 flex items-center justify-center gap-1 py-2 text-sm text-white/40 hover:text-red-400 border border-white/[0.06] rounded-lg hover:border-red-500/20 transition-colors cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Excluir
                </button>
              </div>
            </AdminCard>
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
    </AdminPage>
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

  const inputClass = "w-full px-4 py-2.5 bg-[#0a0a0b] border border-white/[0.06] rounded-lg text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-amber-500/30 transition-colors"
  const labelClass = "block text-xs font-medium text-white/40 uppercase tracking-wider mb-1.5"

  return (
    <AdminModal open={true} onClose={onClose} title={coupon ? 'Editar Cupom' : 'Novo Cupom'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelClass}>Código *</label>
          <input
            type="text"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
            placeholder="DESCONTO10"
            className={`${inputClass} uppercase`}
            required
          />
        </div>

        <div>
          <label className={labelClass}>Descrição</label>
          <input
            type="text"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="10% de desconto na primeira compra"
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Tipo</label>
            <select
              value={form.discountType}
              onChange={(e) => setForm({ ...form, discountType: e.target.value as 'percentage' | 'fixed' })}
              className={`${inputClass} cursor-pointer`}
            >
              <option value="percentage">Porcentagem (%)</option>
              <option value="fixed">Valor Fixo (R$)</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Valor *</label>
            <input
              type="number"
              step="0.01"
              value={form.discountValue}
              onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
              placeholder={form.discountType === 'percentage' ? '10' : '25.00'}
              className={inputClass}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Pedido Mínimo (R$)</label>
            <input
              type="number"
              step="0.01"
              value={form.minOrderValue}
              onChange={(e) => setForm({ ...form, minOrderValue: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Máx. Usos Total</label>
            <input
              type="number"
              value={form.maxUses}
              onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
              placeholder="Ilimitado"
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Usos por Usuário</label>
            <input
              type="number"
              value={form.maxUsesPerUser}
              onChange={(e) => setForm({ ...form, maxUsesPerUser: e.target.value })}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Expira em</label>
            <input
              type="date"
              value={form.expiresAt}
              onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
              className={inputClass}
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
              <ToggleRight className="h-6 w-6 text-emerald-400" />
            ) : (
              <ToggleLeft className="h-6 w-6 text-white/20" />
            )}
          </button>
          <span className="text-sm text-white/60">Exibir na página do produto</span>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-white/[0.06]">
          <AdminButton variant="secondary" onClick={onClose}>Cancelar</AdminButton>
          <AdminButton disabled={saving}>
            {saving ? 'Salvando...' : (coupon ? 'Salvar' : 'Criar Cupom')}
          </AdminButton>
        </div>
      </form>
    </AdminModal>
  )
}

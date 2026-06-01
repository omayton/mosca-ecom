'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit2, Eye, EyeOff, Wand2, GripVertical, Loader2 } from 'lucide-react'

interface Banner {
  id: number
  title: string
  subtitle: string | null
  tag: string | null
  cta_text: string
  cta_link: string
  product_id: number | null
  product_image_url: string | null
  template: string
  bg_color: string
  accent_color: string
  text_color: string
  position: number
  is_active: boolean
  products?: { name: string; price: number; image_file: string; slug: string } | null
}

interface Product {
  id: number
  name: string
  price: number
  description: string
  image_file: string
  slug: string
}

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null)

  const fetchBanners = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/banners')
      if (res.ok) {
        const data = await res.json()
        setBanners(data.banners)
      }
    } catch (err) {
      console.error('Failed to fetch banners:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/admin/products?limit=100')
      if (res.ok) {
        const data = await res.json()
        setProducts(data.products)
      }
    } catch (err) {
      console.error('Failed to fetch products:', err)
    }
  }

  useEffect(() => {
    fetchBanners()
    fetchProducts()
  }, [])

  const toggleActive = async (banner: Banner) => {
    await fetch('/api/admin/banners', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: banner.id, isActive: !banner.is_active })
    })
    fetchBanners()
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Excluir este banner?')) return
    await fetch(`/api/admin/banners?id=${id}`, { method: 'DELETE' })
    fetchBanners()
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Banners</h1>
          <p className="text-white/40 mt-1">Gerencie os banners do carrossel da home</p>
        </div>
        <button
          onClick={() => { setEditingBanner(null); setShowForm(true) }}
          className="flex items-center gap-2 bg-amber-500 text-black px-4 py-2.5 rounded-lg hover:bg-amber-400 transition-colors font-medium cursor-pointer"
        >
          <Plus className="h-5 w-5" />
          Novo Banner
        </button>
      </div>

      {/* Banners List */}
      <div className="space-y-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 bg-[#111113] border border-white/[0.06] rounded-xl animate-pulse" />
          ))
        ) : banners.length === 0 ? (
          <div className="text-center py-16 text-white/40">
            Nenhum banner cadastrado. Crie o primeiro!
          </div>
        ) : (
          banners.map((banner) => (
            <div
              key={banner.id}
              className={`bg-[#111113] border rounded-xl overflow-hidden transition-all ${
                banner.is_active ? 'border-white/[0.06]' : 'border-white/[0.03] opacity-50'
              }`}
            >
              {/* Mini Preview */}
              <div
                className="h-24 flex items-center px-6 gap-6"
                style={{ backgroundColor: banner.bg_color }}
              >
                <div className="flex-1">
                  {banner.tag && (
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                      style={{ backgroundColor: banner.accent_color, color: banner.bg_color }}
                    >
                      {banner.tag}
                    </span>
                  )}
                  <h3 className="text-lg font-bold mt-1" style={{ color: banner.text_color }}>
                    {banner.title}
                  </h3>
                  {banner.subtitle && (
                    <p className="text-xs opacity-60" style={{ color: banner.text_color }}>
                      {banner.subtitle}
                    </p>
                  )}
                </div>
                {banner.product_image_url && (
                  <img
                    src={banner.product_image_url}
                    alt=""
                    className="h-20 w-20 object-contain"
                  />
                )}
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.06]">
                <div className="flex items-center gap-3">
                  <GripVertical className="h-4 w-4 text-white/20" />
                  <span className="text-xs text-white/40">Posição: {banner.position}</span>
                  <span className="text-xs text-white/20">•</span>
                  <span className="text-xs text-white/40 capitalize">{banner.template}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleActive(banner)}
                    className="p-2 text-white/30 hover:text-white/70 transition-colors cursor-pointer"
                    title={banner.is_active ? 'Desativar' : 'Ativar'}
                  >
                    {banner.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => { setEditingBanner(banner); setShowForm(true) }}
                    className="p-2 text-white/30 hover:text-blue-400 transition-colors cursor-pointer"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(banner.id)}
                    className="p-2 text-white/30 hover:text-red-400 transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Banner Form Modal */}
      {showForm && (
        <BannerFormModal
          banner={editingBanner}
          products={products}
          onClose={() => setShowForm(false)}
          onSave={() => { setShowForm(false); fetchBanners() }}
        />
      )}
    </div>
  )
}

function BannerFormModal({ banner, products, onClose, onSave }: {
  banner: Banner | null
  products: Product[]
  onClose: () => void
  onSave: () => void
}) {
  const [form, setForm] = useState({
    title: banner?.title || '',
    subtitle: banner?.subtitle || '',
    tag: banner?.tag || '',
    ctaText: banner?.cta_text || 'Comprar agora',
    ctaLink: banner?.cta_link || '/produtos',
    productId: banner?.product_id?.toString() || '',
    productImageUrl: banner?.product_image_url || '',
    template: banner?.template || 'hero',
    bgColor: banner?.bg_color || '#0a0a0b',
    accentColor: banner?.accent_color || '#dc2626',
    textColor: banner?.text_color || '#ffffff',
    position: banner?.position?.toString() || '0',
  })
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)

  const selectedProduct = products.find(p => p.id.toString() === form.productId)

  // Quando seleciona produto, atualiza imagem
  useEffect(() => {
    if (selectedProduct) {
      const imgUrl = selectedProduct.image_file.startsWith('http')
        ? selectedProduct.image_file
        : `https://www.moscabrancaparts.com.br/wp-content/uploads/2026/04/${selectedProduct.image_file}`
      setForm(prev => ({
        ...prev,
        productImageUrl: imgUrl,
        ctaLink: `/produto/${selectedProduct.slug}`
      }))
    }
  }, [form.productId])

  const generateCopy = async () => {
    if (!selectedProduct) return
    setGenerating(true)

    try {
      const res = await fetch('/api/admin/banners/generate-copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: selectedProduct.name,
          productDescription: selectedProduct.description,
          productPrice: selectedProduct.price,
          template: form.template
        })
      })

      if (res.ok) {
        const copy = await res.json()
        setForm(prev => ({
          ...prev,
          tag: copy.tag || prev.tag,
          title: copy.title || prev.title,
          subtitle: copy.subtitle || prev.subtitle,
          ctaText: copy.ctaText || prev.ctaText,
        }))
      }
    } catch (err) {
      console.error('Generate copy failed:', err)
    } finally {
      setGenerating(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const payload = {
        ...(banner && { id: banner.id }),
        title: form.title,
        subtitle: form.subtitle || null,
        tag: form.tag || null,
        ctaText: form.ctaText,
        ctaLink: form.ctaLink,
        productId: form.productId ? parseInt(form.productId) : null,
        productImageUrl: form.productImageUrl || null,
        template: form.template,
        bgColor: form.bgColor,
        accentColor: form.accentColor,
        textColor: form.textColor,
        position: parseInt(form.position) || 0,
      }

      const res = await fetch('/api/admin/banners', {
        method: banner ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (res.ok) onSave()
      else alert('Erro ao salvar banner')
    } catch (err) {
      alert('Erro de conexão')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 overflow-y-auto">
      <div className="fixed inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-[#111113] border border-white/[0.06] rounded-2xl shadow-2xl w-full max-w-4xl mx-4 mb-8">

        {/* Live Preview */}
        <div
          className="w-full h-[200px] rounded-t-2xl flex items-center px-10 gap-8 overflow-hidden relative"
          style={{ backgroundColor: form.bgColor }}
        >
          <div className="flex-1 z-10">
            {form.tag && (
              <span
                className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full inline-block mb-3"
                style={{ backgroundColor: form.accentColor, color: form.bgColor }}
              >
                {form.tag}
              </span>
            )}
            <h2
              className="text-3xl font-bold leading-tight mb-2"
              style={{ color: form.textColor }}
            >
              {form.title || 'Título do Banner'}
            </h2>
            {form.subtitle && (
              <p className="text-sm opacity-70 mb-4" style={{ color: form.textColor }}>
                {form.subtitle}
              </p>
            )}
            <button
              className="px-5 py-2 rounded-lg text-sm font-semibold"
              style={{ backgroundColor: form.accentColor, color: '#fff' }}
            >
              {form.ctaText || 'Comprar agora'}
            </button>
          </div>
          {form.productImageUrl && (
            <img
              src={form.productImageUrl}
              alt=""
              className="h-[160px] w-auto object-contain drop-shadow-2xl rounded-lg"
              style={{ mixBlendMode: 'multiply' }}
            />
          )}
          <div className="absolute top-3 right-3 px-2 py-1 bg-black/40 rounded text-[10px] text-white/60">
            Preview ao vivo
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">

          {/* Product + Template + AI */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-white/40 mb-1.5 uppercase tracking-wider">Produto</label>
              <select
                value={form.productId}
                onChange={(e) => setForm({ ...form, productId: e.target.value })}
                className="w-full px-3 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white focus:outline-none focus:border-amber-500/40 cursor-pointer"
              >
                <option value="">Selecionar produto...</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-white/40 mb-1.5 uppercase tracking-wider">Template</label>
              <select
                value={form.template}
                onChange={(e) => setForm({ ...form, template: e.target.value })}
                className="w-full px-3 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white focus:outline-none focus:border-amber-500/40 cursor-pointer"
              >
                <option value="hero">Hero (Principal)</option>
                <option value="promo">Promoção</option>
                <option value="launch">Lançamento</option>
                <option value="category">Categoria</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={generateCopy}
                disabled={!selectedProduct || generating}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-black font-medium rounded-lg hover:from-amber-400 hover:to-orange-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                {generating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Wand2 className="h-4 w-4" />
                )}
                {generating ? 'Gerando...' : 'Gerar Copy com IA'}
              </button>
            </div>
          </div>

          {/* Texts */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-white/40 mb-1.5 uppercase tracking-wider">Tag</label>
              <input
                type="text"
                value={form.tag}
                onChange={(e) => setForm({ ...form, tag: e.target.value })}
                placeholder="Exclusivo"
                className="w-full px-3 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-amber-500/40"
              />
            </div>
            <div className="md:col-span-3">
              <label className="block text-xs font-medium text-white/40 mb-1.5 uppercase tracking-wider">Título</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Headline impactante"
                className="w-full px-3 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-amber-500/40"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-white/40 mb-1.5 uppercase tracking-wider">Subtítulo</label>
              <input
                type="text"
                value={form.subtitle}
                onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                placeholder="Frase de apoio com benefício"
                className="w-full px-3 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-amber-500/40"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-white/40 mb-1.5 uppercase tracking-wider">Texto CTA</label>
                <input
                  type="text"
                  value={form.ctaText}
                  onChange={(e) => setForm({ ...form, ctaText: e.target.value })}
                  className="w-full px-3 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-amber-500/40"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/40 mb-1.5 uppercase tracking-wider">Link CTA</label>
                <input
                  type="text"
                  value={form.ctaLink}
                  onChange={(e) => setForm({ ...form, ctaLink: e.target.value })}
                  className="w-full px-3 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-amber-500/40"
                />
              </div>
            </div>
          </div>

          {/* Colors */}
          <div>
            <label className="block text-xs font-medium text-white/40 mb-3 uppercase tracking-wider">Cores</label>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.bgColor}
                  onChange={(e) => setForm({ ...form, bgColor: e.target.value })}
                  className="w-8 h-8 rounded-lg border border-white/10 cursor-pointer"
                />
                <span className="text-xs text-white/40">Fundo</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.accentColor}
                  onChange={(e) => setForm({ ...form, accentColor: e.target.value })}
                  className="w-8 h-8 rounded-lg border border-white/10 cursor-pointer"
                />
                <span className="text-xs text-white/40">Destaque</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.textColor}
                  onChange={(e) => setForm({ ...form, textColor: e.target.value })}
                  className="w-8 h-8 rounded-lg border border-white/10 cursor-pointer"
                />
                <span className="text-xs text-white/40">Texto</span>
              </div>
              <div className="ml-auto">
                <label className="block text-xs text-white/40 mb-1">Posição</label>
                <input
                  type="number"
                  value={form.position}
                  onChange={(e) => setForm({ ...form, position: e.target.value })}
                  className="w-16 px-2 py-1.5 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white text-center focus:outline-none"
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-white/[0.06]">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-white/50 border border-white/[0.08] rounded-lg hover:bg-white/[0.04] cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 text-sm font-medium text-black bg-amber-500 rounded-lg hover:bg-amber-400 disabled:opacity-50 cursor-pointer"
            >
              {saving ? 'Salvando...' : (banner ? 'Salvar' : 'Criar Banner')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
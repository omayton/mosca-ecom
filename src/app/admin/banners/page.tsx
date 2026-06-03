'use client'

import { useState, useEffect, useRef } from 'react'
import { Plus, Trash2, Edit2, Eye, EyeOff, Wand2, GripVertical, Loader2, Upload, X, Image, Code2, Sparkles } from 'lucide-react'
import { imgUrl } from '@/lib/products'

interface Banner {
  id: number
  title: string
  subtitle: string | null
  tag: string | null
  cta_text: string
  cta_link: string
  product_id: number | null
  product_image_url: string | null
  desktop_image_url: string | null
  mobile_image_url: string | null
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
                className="h-24 flex items-center px-6 gap-6 overflow-hidden"
                style={{ backgroundColor: banner.bg_color }}
              >
                <div className="flex-1 min-w-0">
                  {banner.tag && (
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                      style={{ backgroundColor: banner.accent_color, color: '#fff' }}
                    >
                      {banner.tag}
                    </span>
                  )}
                  <h3 className="text-lg font-bold mt-1 truncate" style={{ color: banner.text_color }}>
                    {banner.title}
                  </h3>
                  {banner.subtitle && (
                    <p className="text-xs opacity-60 truncate" style={{ color: banner.text_color }}>
                      {banner.subtitle}
                    </p>
                  )}
                </div>
                {banner.desktop_image_url ? (
                  <div className="relative h-16 w-40 flex-shrink-0 rounded-lg overflow-hidden">
                    <img src={banner.desktop_image_url} alt="" className="w-full h-full object-cover" />
                    <div className="absolute top-1 right-1 bg-black/60 rounded px-1 text-[9px] text-white/70">IMG</div>
                  </div>
                ) : banner.product_image_url ? (
                  <img src={banner.product_image_url} alt="" className="h-16 w-16 object-contain rounded-lg" />
                ) : null}
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.06]">
                <div className="flex items-center gap-3">
                  <GripVertical className="h-4 w-4 text-white/20" />
                  <span className="text-xs text-white/40">Posicao: {banner.position}</span>
                  <span className="text-xs text-white/20">|</span>
                  <span className="text-xs text-white/40 capitalize">{banner.template}</span>
                  <span className="text-xs text-white/20">|</span>
                  <span className={`text-xs font-medium ${banner.desktop_image_url ? 'text-green-400/60' : 'text-white/30'}`}>
                    {banner.desktop_image_url ? 'Imagem Completa' : 'HTML'}
                  </span>
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

type BannerType = 'full-image' | 'html'

function BannerFormModal({ banner, products, onClose, onSave }: {
  banner: Banner | null
  products: Product[]
  onClose: () => void
  onSave: () => void
}) {
  const [bannerType, setBannerType] = useState<BannerType>(
    banner?.desktop_image_url ? 'full-image' : 'html'
  )
  const [form, setForm] = useState({
    title: banner?.title || '',
    subtitle: banner?.subtitle || '',
    tag: banner?.tag || '',
    ctaText: banner?.cta_text || 'Ver produtos',
    ctaLink: banner?.cta_link || '/loja',
    productId: banner?.product_id?.toString() || '',
    productImageUrl: banner?.product_image_url || '',
    template: banner?.template || 'hero',
    bgColor: banner?.bg_color || '#0a0a0b',
    accentColor: banner?.accent_color || '#dc2626',
    textColor: banner?.text_color || '#ffffff',
    position: banner?.position?.toString() || '0',
    customPrompt: '',
    desktopImageUrl: banner?.desktop_image_url || '',
    mobileImageUrl: banner?.mobile_image_url || '',
  })
  const [saving, setSaving] = useState(false)
  const [generatingImage, setGeneratingImage] = useState(false)
  const [generatingCopy, setGeneratingCopy] = useState(false)
  const [uploadingDesktop, setUploadingDesktop] = useState(false)
  const [uploadingMobile, setUploadingMobile] = useState(false)
  const [dragOverDesktop, setDragOverDesktop] = useState(false)
  const [dragOverMobile, setDragOverMobile] = useState(false)
  const desktopInputRef = useRef<HTMLInputElement>(null)
  const mobileInputRef = useRef<HTMLInputElement>(null)

  const selectedProduct = products.find(p => p.id.toString() === form.productId)

  useEffect(() => {
    if (selectedProduct) {
      setForm(prev => ({
        ...prev,
        productImageUrl: imgUrl(selectedProduct.image_file),
        ctaLink: `/produto/${selectedProduct.slug}`
      }))
    }
  }, [form.productId])

  // Quando muda o tipo, limpa os campos de imagem
  const handleBannerTypeChange = (type: BannerType) => {
    setBannerType(type)
    if (type === 'full-image') {
      setForm(prev => ({ ...prev, bgColor: '#0a0a0b', textColor: '#ffffff' }))
    }
  }

  const generateBannerImage = async () => {
    if (!form.productImageUrl) {
      alert('Selecione um produto primeiro para gerar o banner.')
      return
    }
    setGeneratingImage(true)
    try {
      const res = await fetch('/api/admin/banners/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productImageUrl: form.productImageUrl,
          customPrompt: form.customPrompt,
        })
      })
      if (res.ok) {
        const data = await res.json()
        setForm(prev => ({
          ...prev,
          desktopImageUrl: data.imageUrl,
          mobileImageUrl: data.imageUrl,
        }))
      } else {
        const data = await res.json()
        alert(data.error || 'Erro ao gerar banner.')
      }
    } catch {
      alert('Erro de conexao.')
    } finally {
      setGeneratingImage(false)
    }
  }

  const generateCopy = async () => {
    if (!selectedProduct) return
    setGeneratingCopy(true)
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
      setGeneratingCopy(false)
    }
  }

  const handleImageUpload = async (file: File, field: 'desktop' | 'mobile') => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      alert('Use JPG, PNG ou WebP')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Maximo 5MB')
      return
    }

    if (field === 'desktop') setUploadingDesktop(true)
    else setUploadingMobile(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/admin/upload', { method: 'POST', body: formData })
      if (res.ok) {
        const data = await res.json()
        setForm(prev => ({
          ...prev,
          [field === 'desktop' ? 'desktopImageUrl' : 'mobileImageUrl']: data.url
        }))
      } else {
        const data = await res.json()
        alert(data.error || 'Erro no upload')
      }
    } catch {
      alert('Erro de conexao')
    } finally {
      if (field === 'desktop') setUploadingDesktop(false)
      else setUploadingMobile(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const payload = {
        ...(banner && { id: banner.id }),
        title: form.title || null,
        subtitle: form.subtitle || null,
        tag: form.tag || null,
        ctaText: form.ctaText || 'Ver produtos',
        ctaLink: form.ctaLink || '/loja',
        productId: form.productId ? parseInt(form.productId) : null,
        productImageUrl: form.productImageUrl || null,
        desktopImageUrl: form.desktopImageUrl || null,
        mobileImageUrl: form.mobileImageUrl || null,
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
    } catch {
      alert('Erro de conexao')
    } finally {
      setSaving(false)
    }
  }

  const hasFullImage = !!form.desktopImageUrl

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-6 overflow-y-auto pb-6">
      <div className="fixed inset-0 bg-black/80" onClick={onClose} />
      <div className="relative bg-[#0d0d0f] border border-white/[0.08] rounded-2xl shadow-2xl w-full max-w-[780px] mx-4">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <div>
            <h2 className="text-lg font-bold text-white">
              {banner ? 'Editar Banner' : 'Novo Banner'}
            </h2>
            <p className="text-xs text-white/30 mt-0.5">Carrossel da pagina inicial</p>
          </div>
          <button onClick={onClose} className="p-2 text-white/30 hover:text-white/60 transition-colors cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Banner Type Toggle */}
        <div className="px-6 pt-5">
          <div className="flex items-center bg-white/[0.04] rounded-xl p-1 gap-1">
            <button
              onClick={() => handleBannerTypeChange('full-image')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                bannerType === 'full-image'
                  ? 'bg-amber-500 text-black shadow-lg'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/[0.04]'
              }`}
            >
              <Image className="h-4 w-4" />
              Imagem Completa
            </button>
            <button
              onClick={() => handleBannerTypeChange('html')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                bannerType === 'html'
                  ? 'bg-amber-500 text-black shadow-lg'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/[0.04]'
              }`}
            >
              <Code2 className="h-4 w-4" />
              Banner HTML
            </button>
          </div>
        </div>

        {/* Live Preview */}
        <div className="mx-6 mt-5 rounded-xl overflow-hidden h-[180px] relative">
          {hasFullImage ? (
            <img
              src={form.desktopImageUrl}
              alt="Preview"
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className="w-full h-full flex items-center px-10 gap-8"
              style={{ backgroundColor: form.bgColor }}
            >
              <div className="flex-1">
                {form.tag && (
                  <span
                    className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full inline-block mb-3"
                    style={{ backgroundColor: form.accentColor, color: '#fff' }}
                  >
                    {form.tag}
                  </span>
                )}
                <h2 className="text-3xl font-black leading-tight mb-2" style={{ color: form.textColor }}>
                  {form.title || 'Titulo do Banner'}
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
                  {form.ctaText || 'Ver produtos'}
                </button>
              </div>
              {form.productImageUrl && (
                <img
                  src={form.productImageUrl}
                  alt=""
                  className="h-[140px] w-auto object-contain"
                />
              )}
            </div>
          )}
          <div className="absolute top-2 right-2 px-2 py-1 bg-black/50 rounded text-[10px] text-white/60 backdrop-blur-sm">
            Preview ao vivo
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 pb-6 pt-5 space-y-6">

          {/* === MODO IMAGEM COMPLETA === */}
          {bannerType === 'full-image' && (
            <div className="space-y-5">

              {/* Selecao de produto */}
              <div>
                <label className="block text-xs font-medium text-white/40 mb-2 uppercase tracking-wider">
                  Produto (usado para gerar o banner)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={form.productId}
                    onChange={(e) => setForm({ ...form, productId: e.target.value })}
                    className="px-3 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white focus:outline-none focus:border-amber-500/40 cursor-pointer"
                  >
                    <option value="">Selecionar produto...</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <div className="flex items-center gap-2">
                    {form.productImageUrl && (
                      <img
                        src={form.productImageUrl}
                        alt=""
                        className="h-10 w-10 object-contain rounded border border-white/10"
                      />
                    )}
                    <span className="text-xs text-white/30">
                      {selectedProduct ? selectedProduct.name : 'Sem produto selecionado'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Instrucoes IA */}
              <div>
                <label className="block text-xs font-medium text-white/40 mb-2 uppercase tracking-wider">
                  Instrucoes para geracao (opcional)
                </label>
                <textarea
                  value={form.customPrompt}
                  onChange={(e) => setForm({ ...form, customPrompt: e.target.value })}
                  placeholder="Ex: Banner vermelho com preto, cupom MOSCA10, fundo escuro com detalhes geometricos..."
                  rows={2}
                  className="w-full px-3 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-amber-500/40 resize-none"
                />
                <p className="text-[10px] text-white/20 mt-1.5">
                  Suas instrucoes sao somadas ao prompt pre-configurado (tamanho 1440x480, estilo premium, etc.)
                </p>
              </div>

              {/* Botao Gerar com IA */}
              <button
                type="button"
                onClick={generateBannerImage}
                disabled={!form.productImageUrl || generatingImage}
                className="w-full flex items-center justify-center gap-3 px-5 py-4 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all shadow-lg shadow-violet-900/30 cursor-pointer"
              >
                {generatingImage ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Gerando banner... aguarde ate 30s</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5" />
                    <span>Gerar Banner com IA (DALL-E 3)</span>
                  </>
                )}
              </button>

              {/* Separador */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-white/[0.06]" />
                <span className="text-xs text-white/20 uppercase tracking-wider">ou upload manual</span>
                <div className="flex-1 h-px bg-white/[0.06]" />
              </div>

              {/* Upload Desktop */}
              <div>
                <label className="block text-xs font-medium text-white/40 mb-2 uppercase tracking-wider">
                  Banner Desktop
                  <span className="text-white/20 ml-2 normal-case font-normal">(1440x480px recomendado)</span>
                </label>
                {form.desktopImageUrl ? (
                  <div className="relative rounded-xl overflow-hidden border border-white/[0.08] group h-32 bg-white/[0.02]">
                    <img src={form.desktopImageUrl} alt="Desktop" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => desktopInputRef.current?.click()}
                        className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-sm font-medium text-white hover:bg-white/20 cursor-pointer"
                      >
                        Trocar
                      </button>
                      <button
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, desktopImageUrl: '' }))}
                        className="p-2 bg-red-600 rounded-lg text-white hover:bg-red-700 cursor-pointer"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    {uploadingDesktop && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <Loader2 className="h-6 w-6 text-white animate-spin" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    onDragOver={e => { e.preventDefault(); setDragOverDesktop(true) }}
                    onDragLeave={() => setDragOverDesktop(false)}
                    onDrop={e => {
                      e.preventDefault()
                      setDragOverDesktop(false)
                      const file = e.dataTransfer.files[0]
                      if (file) handleImageUpload(file, 'desktop')
                    }}
                    onClick={() => desktopInputRef.current?.click()}
                    className={`h-32 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${dragOverDesktop ? 'border-amber-400 bg-amber-500/10' : 'border-white/[0.1] bg-white/[0.02] hover:border-amber-500/40'}`}
                  >
                    {uploadingDesktop ? (
                      <Loader2 className="h-7 w-7 text-amber-500 animate-spin" />
                    ) : (
                      <>
                        <Upload className="h-6 w-6 text-white/30" />
                        <p className="text-sm text-white/30">Arraste ou clique para enviar</p>
                      </>
                    )}
                  </div>
                )}
                <input ref={desktopInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f, 'desktop') }} />
              </div>

              {/* Upload Mobile */}
              <div>
                <label className="block text-xs font-medium text-white/40 mb-2 uppercase tracking-wider">
                  Banner Mobile
                  <span className="text-white/20 ml-2 normal-case font-normal">(375x200px recomendado)</span>
                </label>
                {form.mobileImageUrl ? (
                  <div className="relative rounded-xl overflow-hidden border border-white/[0.08] group h-32 bg-white/[0.02]">
                    <img src={form.mobileImageUrl} alt="Mobile" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <button type="button" onClick={() => mobileInputRef.current?.click()} className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-sm font-medium text-white hover:bg-white/20 cursor-pointer">
                        Trocar
                      </button>
                      <button type="button" onClick={() => setForm(prev => ({ ...prev, mobileImageUrl: '' }))} className="p-2 bg-red-600 rounded-lg text-white hover:bg-red-700 cursor-pointer">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    {uploadingMobile && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <Loader2 className="h-6 w-6 text-white animate-spin" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    onDragOver={e => { e.preventDefault(); setDragOverMobile(true) }}
                    onDragLeave={() => setDragOverMobile(false)}
                    onDrop={e => {
                      e.preventDefault()
                      setDragOverMobile(false)
                      const file = e.dataTransfer.files[0]
                      if (file) handleImageUpload(file, 'mobile')
                    }}
                    onClick={() => mobileInputRef.current?.click()}
                    className={`h-32 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${dragOverMobile ? 'border-amber-400 bg-amber-500/10' : 'border-white/[0.1] bg-white/[0.02] hover:border-amber-500/40'}`}
                  >
                    {uploadingMobile ? (
                      <Loader2 className="h-7 w-7 text-amber-500 animate-spin" />
                    ) : (
                      <>
                        <Upload className="h-6 w-6 text-white/30" />
                        <p className="text-sm text-white/30">Arraste ou clique para enviar</p>
                      </>
                    )}
                  </div>
                )}
                <input ref={mobileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f, 'mobile') }} />
              </div>

              {/* Posicao */}
              <div className="flex items-center gap-4 pt-2">
                <div>
                  <label className="block text-xs font-medium text-white/40 mb-1 uppercase tracking-wider">Posicao</label>
                  <input
                    type="number"
                    value={form.position}
                    onChange={e => setForm(prev => ({ ...prev, position: e.target.value }))}
                    className="w-20 px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white text-center focus:outline-none focus:border-amber-500/40"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/40 mb-1 uppercase tracking-wider">Template</label>
                  <select
                    value={form.template}
                    onChange={e => setForm(prev => ({ ...prev, template: e.target.value }))}
                    className="px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white focus:outline-none focus:border-amber-500/40 cursor-pointer"
                  >
                    <option value="hero">Hero</option>
                    <option value="promo">Promocao</option>
                    <option value="launch">Lancamento</option>
                    <option value="category">Categoria</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* === MODO HTML === */}
          {bannerType === 'html' && (
            <div className="space-y-5">

              {/* Produto + Template */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-white/40 mb-2 uppercase tracking-wider">Produto</label>
                  <select
                    value={form.productId}
                    onChange={e => setForm({ ...form, productId: e.target.value })}
                    className="w-full px-3 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white focus:outline-none focus:border-amber-500/40 cursor-pointer"
                  >
                    <option value="">Selecionar produto...</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/40 mb-2 uppercase tracking-wider">Template</label>
                  <div className="flex items-center gap-2">
                    <select
                      value={form.template}
                      onChange={e => setForm(prev => ({ ...prev, template: e.target.value }))}
                      className="flex-1 px-3 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white focus:outline-none focus:border-amber-500/40 cursor-pointer"
                    >
                      <option value="hero">Hero</option>
                      <option value="promo">Promocao</option>
                      <option value="launch">Lancamento</option>
                      <option value="category">Categoria</option>
                    </select>
                    <button
                      type="button"
                      onClick={generateCopy}
                      disabled={!selectedProduct || generatingCopy}
                      className="flex items-center gap-1.5 px-3 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-black text-sm font-medium rounded-lg hover:from-amber-400 hover:to-orange-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer whitespace-nowrap"
                    >
                      {generatingCopy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                      Gerar copy
                    </button>
                  </div>
                </div>
              </div>

              {/* Imagem do produto */}
              <div>
                <label className="block text-xs font-medium text-white/40 mb-2 uppercase tracking-wider">Imagem do Produto</label>
                {form.productImageUrl ? (
                  <div className="relative w-full h-32 rounded-xl overflow-hidden border border-white/[0.08] group bg-white/[0.02]">
                    <img src={form.productImageUrl} alt="Preview" className="w-full h-full object-contain" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button type="button" onClick={() => setForm(prev => ({ ...prev, productImageUrl: '' }))} className="p-2 bg-red-600 rounded-lg text-white hover:bg-red-700 cursor-pointer">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="h-32 rounded-xl border-2 border-dashed border-white/[0.1] bg-white/[0.02] flex flex-col items-center justify-center gap-2">
                    <p className="text-sm text-white/30">Selecione um produto acima para usar sua imagem</p>
                  </div>
                )}
              </div>

              {/* Tag + Titulo */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-white/40 mb-2 uppercase tracking-wider">Tag</label>
                  <input type="text" value={form.tag} onChange={e => setForm(prev => ({ ...prev, tag: e.target.value }))} placeholder="Exclusivo" className="w-full px-3 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-amber-500/40" />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-xs font-medium text-white/40 mb-2 uppercase tracking-wider">Titulo <span className="text-red-400">*</span></label>
                  <input type="text" value={form.title} onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))} placeholder="Headline impactante" className="w-full px-3 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-amber-500/40" required />
                </div>
              </div>

              {/* Subtitulo */}
              <div>
                <label className="block text-xs font-medium text-white/40 mb-2 uppercase tracking-wider">Subtitulo</label>
                <input type="text" value={form.subtitle} onChange={e => setForm(prev => ({ ...prev, subtitle: e.target.value }))} placeholder="Frase de apoio com beneficio" className="w-full px-3 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-amber-500/40" />
              </div>

              {/* CTA */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-white/40 mb-2 uppercase tracking-wider">Texto CTA</label>
                  <input type="text" value={form.ctaText} onChange={e => setForm(prev => ({ ...prev, ctaText: e.target.value }))} className="w-full px-3 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-amber-500/40" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/40 mb-2 uppercase tracking-wider">Link CTA</label>
                  <input type="text" value={form.ctaLink} onChange={e => setForm(prev => ({ ...prev, ctaLink: e.target.value }))} className="w-full px-3 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-amber-500/40" />
                </div>
              </div>

              {/* Cores */}
              <div>
                <label className="block text-xs font-medium text-white/40 mb-3 uppercase tracking-wider">Cores</label>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <input type="color" value={form.bgColor} onChange={e => setForm(prev => ({ ...prev, bgColor: e.target.value }))} className="w-8 h-8 rounded-lg border border-white/10 cursor-pointer" />
                    <span className="text-xs text-white/40">Fundo</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="color" value={form.accentColor} onChange={e => setForm(prev => ({ ...prev, accentColor: e.target.value }))} className="w-8 h-8 rounded-lg border border-white/10 cursor-pointer" />
                    <span className="text-xs text-white/40">Destaque</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="color" value={form.textColor} onChange={e => setForm(prev => ({ ...prev, textColor: e.target.value }))} className="w-8 h-8 rounded-lg border border-white/10 cursor-pointer" />
                    <span className="text-xs text-white/40">Texto</span>
                  </div>
                  <div>
                    <label className="block text-xs text-white/40 mb-1">Posicao</label>
                    <input type="number" value={form.position} onChange={e => setForm(prev => ({ ...prev, position: e.target.value }))} className="w-16 px-2 py-1.5 bg-white/[0.04] border border-white/[0.08] rounded-lg text-sm text-white text-center focus:outline-none" min="0" />
                  </div>
                </div>
              </div>
            </div>
          )}

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
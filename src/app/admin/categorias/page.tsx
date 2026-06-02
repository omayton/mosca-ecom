'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, ToggleLeft, ToggleRight, Layers, GripVertical } from 'lucide-react'

interface Category {
  id: number
  name: string
  slug: string
  description: string
  is_active: boolean
  sort_order: number
  created_at: string
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    sortOrder: 0,
    isActive: true,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const fetchCategories = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/categories')
      if (res.ok) {
        const data = await res.json()
        setCategories(data.categories)
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCategories() }, [])

  const openNewForm = () => {
    setEditingCategory(null)
    setFormData({ name: '', slug: '', description: '', sortOrder: categories.length + 1, isActive: true })
    setError('')
    setShowForm(true)
  }

  const openEditForm = (cat: Category) => {
    setEditingCategory(cat)
    setFormData({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || '',
      sortOrder: cat.sort_order,
      isActive: cat.is_active,
    })
    setError('')
    setShowForm(true)
  }

  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      slug: editingCategory ? prev.slug : slugify(name),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    setSaving(true)
    setError('')

    try {
      const method = editingCategory ? 'PATCH' : 'POST'
      const body = editingCategory
        ? { id: editingCategory.id, ...formData }
        : formData

      const res = await fetch('/api/admin/categories', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Erro ao salvar categoria.')
        return
      }

      setShowForm(false)
      fetchCategories()
    } catch {
      setError('Erro de conexão.')
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (cat: Category) => {
    try {
      await fetch('/api/admin/categories', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: cat.id, isActive: !cat.is_active }),
      })
      fetchCategories()
    } catch (err) {
      console.error('Toggle failed:', err)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta categoria?')) return
    try {
      await fetch(`/api/admin/categories?id=${id}`, { method: 'DELETE' })
      fetchCategories()
    } catch (err) {
      console.error('Delete failed:', err)
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Categorias</h1>
          <p className="text-white/40 mt-1 text-sm">{categories.length} categorias cadastradas</p>
        </div>
        <button
          onClick={openNewForm}
          className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-semibold px-4 py-2.5 rounded-lg hover:from-amber-400 hover:to-amber-500 transition-all cursor-pointer"
        >
          <Plus className="h-5 w-5" />
          Nova Categoria
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="mb-8 bg-[#111113] border border-white/[0.06] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-white/60 mb-1.5">Nome</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Ex: Iluminação"
                  className="w-full bg-[#0a0a0b] border border-white/[0.06] rounded-lg px-4 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-amber-500/50"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-1.5">Slug (URL)</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                  placeholder="iluminacao"
                  className="w-full bg-[#0a0a0b] border border-white/[0.06] rounded-lg px-4 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-amber-500/50 font-mono"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1.5">Descrição (opcional)</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Descrição breve da categoria"
                className="w-full bg-[#0a0a0b] border border-white/[0.06] rounded-lg px-4 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-amber-500/50"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-white/60 mb-1.5">Ordem</label>
                <input
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData((prev) => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))}
                  className="w-full bg-[#0a0a0b] border border-white/[0.06] rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500/50"
                  min={0}
                />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData((prev) => ({ ...prev, isActive: e.target.checked }))}
                    className="sr-only"
                  />
                  <div className={`w-10 h-5 rounded-full transition-colors ${formData.isActive ? 'bg-amber-500' : 'bg-white/10'} relative`}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${formData.isActive ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </div>
                  <span className="text-sm text-white/60">{formData.isActive ? 'Ativa' : 'Inativa'}</span>
                </label>
              </div>
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="bg-gradient-to-r from-amber-500 to-amber-600 text-black font-semibold px-6 py-2.5 rounded-lg hover:from-amber-400 hover:to-amber-500 transition-all cursor-pointer disabled:opacity-50"
              >
                {saving ? 'Salvando...' : editingCategory ? 'Salvar Alterações' : 'Criar Categoria'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-2.5 border border-white/[0.06] text-white/60 rounded-lg hover:text-white hover:border-white/20 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="text-center py-12 text-white/40">Carregando...</div>
      ) : categories.length === 0 ? (
        <div className="text-center py-12 bg-[#111113] border border-white/[0.06] rounded-xl">
          <Layers className="h-12 w-12 text-white/20 mx-auto mb-3" />
          <p className="text-white/40">Nenhuma categoria cadastrada</p>
        </div>
      ) : (
        <div className="bg-[#111113] border border-white/[0.06] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left text-xs text-white/40 font-medium uppercase tracking-wider px-5 py-3">Ordem</th>
                <th className="text-left text-xs text-white/40 font-medium uppercase tracking-wider px-5 py-3">Nome</th>
                <th className="text-left text-xs text-white/40 font-medium uppercase tracking-wider px-5 py-3">Slug</th>
                <th className="text-left text-xs text-white/40 font-medium uppercase tracking-wider px-5 py-3">Status</th>
                <th className="text-right text-xs text-white/40 font-medium uppercase tracking-wider px-5 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3">
                    <span className="text-white/40 text-sm flex items-center gap-1.5">
                      <GripVertical className="h-3.5 w-3.5" />
                      {cat.sort_order}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-white font-medium text-sm">{cat.name}</span>
                  </td>
                  <td className="px-5 py-3">
                    <code className="text-amber-400/80 text-xs bg-amber-500/10 px-2 py-0.5 rounded">{cat.slug}</code>
                  </td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => toggleActive(cat)}
                      className="cursor-pointer"
                      aria-label={cat.is_active ? 'Desativar' : 'Ativar'}
                    >
                      {cat.is_active ? (
                        <span className="flex items-center gap-1.5 text-emerald-400 text-xs">
                          <ToggleRight className="h-4 w-4" /> Ativa
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-white/30 text-xs">
                          <ToggleLeft className="h-4 w-4" /> Inativa
                        </span>
                      )}
                    </button>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditForm(cat)}
                        className="p-2 text-white/40 hover:text-amber-400 transition-colors cursor-pointer"
                        aria-label="Editar"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(cat.id)}
                        className="p-2 text-white/40 hover:text-red-400 transition-colors cursor-pointer"
                        aria-label="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

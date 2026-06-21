'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Newspaper, Plus, Edit2, Trash2, Eye, EyeOff, Loader2, Upload, ExternalLink } from 'lucide-react'
import {
  AdminPage, AdminHeader, AdminCard, AdminBadge,
  AdminEmptyState, AdminButton, AdminModal, AdminInput, AdminTextarea,
} from '@/components/admin/admin-ui'

interface BlogPost {
  id: number
  slug: string
  title: string
  excerpt: string | null
  cover_image_url: string | null
  author: string
  category: string | null
  is_published: boolean
  published_at: string | null
  created_at: string
}

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return iso
  }
}

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<BlogPost | null>(null)

  const fetchPosts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/blog')
      if (res.ok) {
        const data = await res.json()
        setPosts(data.posts || [])
      }
    } catch (e) {
      console.error('Failed to fetch posts:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchPosts() }, [fetchPosts])

  const togglePublish = async (p: BlogPost) => {
    await fetch('/api/admin/blog', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: p.id, isPublished: !p.is_published }),
    })
    fetchPosts()
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Excluir este post definitivamente?')) return
    await fetch(`/api/admin/blog?id=${id}`, { method: 'DELETE' })
    fetchPosts()
  }

  const openEdit = (p: BlogPost) => {
    setEditing(p)
    setShowForm(true)
  }

  return (
    <AdminPage>
      <AdminHeader title="Blog" subtitle={loading ? 'Carregando...' : `${posts.length} post(s)`}>
        <AdminButton onClick={() => { setEditing(null); setShowForm(true) }}>
          <Plus className="h-4 w-4" /> Novo Post
        </AdminButton>
      </AdminHeader>

      <div className="mx-6 mb-6 p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl">
        <p className="text-blue-400/90 text-sm font-medium mb-1 flex items-center gap-2"><Newspaper className="h-4 w-4" /> Conteúdo para SEO e tráfego</p>
        <p className="text-white/40 text-xs leading-relaxed">
          Notícias e artigos autorais sobre o universo automotivo. Use markdown para formatação
          (<strong className="text-white/60">**negrito**</strong>, <strong className="text-white/60"># título</strong>, <strong className="text-white/60">- lista</strong>, <strong className="text-white/60">[link](url)</strong>).
          Os posts publicados aparecem em <strong className="text-white/60">/blog</strong>.
        </p>
      </div>

      {loading ? (
        <div className="space-y-3 px-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 bg-white/[0.02] animate-pulse rounded-xl" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <AdminEmptyState
          icon={Newspaper}
          title="Nenhum post ainda"
          description="Crie o primeiro artigo do blog para atrair tráfego orgânico."
        />
      ) : (
        <div className="space-y-3">
          {posts.map((p) => (
            <AdminCard key={p.id}>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/[0.04] flex items-center justify-center flex-shrink-0">
                    {p.cover_image_url ? (
                      <img src={p.cover_image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Newspaper className="h-5 w-5 text-white/20" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-white truncate">{p.title}</p>
                      <AdminBadge label={p.is_published ? 'Publicado' : 'Rascunho'} variant={p.is_published ? 'success' : 'neutral'} />
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-white/40 mt-1">
                      {p.category && <span className="text-blue-400/80">{p.category}</span>}
                      <span>{p.author}</span>
                      <span>Publicado: {fmtDate(p.published_at)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {p.is_published && (
                    <a
                      href={`https://www.moscabrancaparts.com.br/blog/${p.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Ver no site"
                      className="p-2 text-white/30 hover:text-blue-400 transition-colors cursor-pointer"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                  <button
                    onClick={() => togglePublish(p)}
                    title={p.is_published ? 'Despublicar' : 'Publicar'}
                    className="p-2 text-white/30 hover:text-amber-400 transition-colors cursor-pointer"
                  >
                    {p.is_published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  <button onClick={() => openEdit(p)} className="p-2 text-white/30 hover:text-blue-400 transition-colors cursor-pointer">
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDelete(p.id)} className="p-2 text-white/30 hover:text-red-400 transition-colors cursor-pointer">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </AdminCard>
          ))}
        </div>
      )}

      {showForm && (
        <PostForm
          editing={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); fetchPosts() }}
        />
      )}
    </AdminPage>
  )
}

function PostForm({ editing, onClose, onSaved }: {
  editing: BlogPost | null
  onClose: () => void
  onSaved: () => void
}) {
  // edição carrega o post completo (com content) do endpoint detalhe
  const [title, setTitle] = useState(editing?.title || '')
  const [excerpt, setExcerpt] = useState(editing?.excerpt || '')
  const [content, setContent] = useState('')
  const [cover, setCover] = useState(editing?.cover_image_url || '')
  const [author, setAuthor] = useState(editing?.author || 'Equipe Mosca Branca Parts')
  const [category, setCategory] = useState(editing?.category || '')
  const [tagsStr, setTagsStr] = useState('')
  const [metaTitle, setMetaTitle] = useState('')
  const [metaDesc, setMetaDesc] = useState('')
  const [published, setPublished] = useState(editing?.is_published || false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(!!editing)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!editing) return
    // carrega conteúdo completo
    fetch(`/api/admin/blog?id=${editing.id}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (d?.post) {
          setContent(d.post.content || '')
          setExcerpt(d.post.excerpt || '')
          setCover(d.post.cover_image_url || '')
          setMetaTitle(d.post.meta_title || '')
          setMetaDesc(d.post.meta_description || '')
          setTagsStr((d.post.tags || []).join(', '))
        }
      })
      .finally(() => setLoading(false))
  }, [editing])

  async function uploadCover(file: File) {
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await fetch('/api/admin/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (res.ok && data.url) setCover(data.url)
      else setError(data.error || 'Erro no upload')
    } catch {
      setError('Erro de conexão no upload')
    }
  }

  async function save() {
    setError('')
    if (!title.trim()) { setError('Título obrigatório.'); return }
    setSaving(true)
    try {
      const tags = tagsStr.split(',').map((t) => t.trim()).filter(Boolean)
      const method = editing ? 'PATCH' : 'POST'
      const body: any = {
        title, excerpt, content, coverImageUrl: cover, author,
        category: category || null, tags, metaTitle, metaDescription: metaDesc,
        isPublished: published,
      }
      if (editing) body.id = editing.id

      const res = await fetch('/api/admin/blog', {
        method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
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
    <AdminModal open onClose={onClose} title={editing ? 'Editar Post' : 'Novo Post'} wide>
      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-amber-400" /></div>
      ) : (
        <div className="space-y-4">
          <AdminInput label="Título" value={title} onChange={setTitle} placeholder="Ex: 5 sinais de que o freio precisa de atenção" required />

          <AdminTextarea label="Resumo (excerpt)" value={excerpt} onChange={setExcerpt} placeholder="Aparece na listagem do blog e na meta description" rows={2} />

          <div className="grid grid-cols-2 gap-3">
            <AdminInput label="Categoria" value={category} onChange={setCategory} placeholder="Ex: Manutenção" />
            <AdminInput label="Autor" value={author} onChange={setAuthor} />
          </div>

          <AdminInput label="Tags (separadas por vírgula)" value={tagsStr} onChange={setTagsStr} placeholder="freio, manutenção, segurança" />

          {/* Cover image */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Imagem de capa</label>
            <div className="flex gap-2">
              <input
                value={cover}
                onChange={(e) => setCover(e.target.value)}
                placeholder="URL da imagem"
                className="flex-1 bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500/50"
              />
              <button
                onClick={() => fileRef.current?.click()}
                className="px-3 py-2 bg-white/[0.06] border border-white/[0.08] text-white/60 hover:text-white rounded-lg text-sm flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Upload className="h-4 w-4" /> Enviar
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadCover(f) }}
              />
            </div>
            {cover && <img src={cover} alt="" className="mt-2 h-24 w-full object-cover rounded-lg" />}
          </div>

          {/* Markdown content */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              Conteúdo <span className="text-white/30 normal-case font-normal">(markdown)</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={14}
              placeholder={"# Título\n\nParágrafo do artigo...\n\n- Item 1\n- Item 2\n\n**Negrito** e [link](https://...)"}
              className="w-full bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/20 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-amber-500/50 leading-relaxed"
            />
          </div>

          {/* SEO */}
          <details className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-3">
            <summary className="text-sm text-white/60 cursor-pointer">SEO (opcional)</summary>
            <div className="space-y-3 mt-3">
              <AdminInput label="Meta título" value={metaTitle} onChange={setMetaTitle} placeholder="Opcional — usa o título se vazio" />
              <AdminTextarea label="Meta description" value={metaDesc} onChange={setMetaDesc} rows={2} placeholder="Opcional — usa o resumo se vazio" />
            </div>
          </details>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} className="h-4 w-4 accent-amber-500" />
            <span className="text-sm text-white/70">Publicar agora</span>
          </label>

          {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <AdminButton variant="ghost" onClick={onClose}>Cancelar</AdminButton>
            <AdminButton onClick={save} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {editing ? 'Salvar alterações' : 'Criar post'}
            </AdminButton>
          </div>
        </div>
      )}
    </AdminModal>
  )
}

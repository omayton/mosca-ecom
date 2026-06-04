'use client'

import { useState, useEffect } from 'react'
import { Star, Check, X, Trash2, ShieldCheck } from 'lucide-react'

interface Review {
  id: number
  product_id: number
  user_name: string
  rating: number
  title: string
  comment: string
  is_verified_purchase: boolean
  is_approved: boolean
  created_at: string
  products: { name: string; slug: string }
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'pending' | 'approved' | 'all'>('pending')

  const fetchReviews = async () => {
    setLoading(true)
    try {
      const params = filter !== 'all' ? `?status=${filter}` : ''
      const res = await fetch(`/api/admin/reviews${params}`)
      if (res.ok) {
        const data = await res.json()
        setReviews(data.reviews || [])
      }
    } catch (err) {
      console.error('Failed to fetch reviews:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchReviews() }, [filter])

  const handleApprove = async (id: number) => {
    await fetch('/api/admin/reviews', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, isApproved: true }),
    })
    fetchReviews()
  }

  const handleReject = async (id: number) => {
    await fetch('/api/admin/reviews', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, isApproved: false }),
    })
    fetchReviews()
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Excluir esta avaliação permanentemente?')) return
    await fetch(`/api/admin/reviews?id=${id}`, { method: 'DELETE' })
    fetchReviews()
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Avaliações</h1>
          <p className="text-white/40 mt-1 text-sm">{reviews.length} avaliações</p>
        </div>
        <div className="flex gap-2">
          {(['pending', 'approved', 'all'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                filter === f
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'text-white/40 border border-white/[0.06] hover:text-white/70'
              }`}
            >
              {f === 'pending' ? 'Pendentes' : f === 'approved' ? 'Aprovadas' : 'Todas'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-white/40">Carregando...</div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12 bg-[#111113] border border-white/[0.06] rounded-xl">
          <Star className="h-12 w-12 text-white/20 mx-auto mb-3" />
          <p className="text-white/40">Nenhuma avaliação {filter === 'pending' ? 'pendente' : ''}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="bg-[#111113] border border-white/[0.06] rounded-xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${i < review.rating ? 'text-amber-400 fill-amber-400' : 'text-white/10'}`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-white/60 font-medium">{review.user_name}</span>
                    {review.is_verified_purchase && (
                      <span className="flex items-center gap-1 text-xs text-emerald-400">
                        <ShieldCheck className="h-3.5 w-3.5" /> Compra verificada
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-white/30 mb-2">
                    Produto: <span className="text-white/50">{review.products?.name}</span>
                    {' · '}
                    {new Date(review.created_at).toLocaleDateString('pt-BR')}
                  </p>
                  {review.title && <p className="text-sm text-white font-medium mb-1">{review.title}</p>}
                  {review.comment && <p className="text-sm text-white/60">{review.comment}</p>}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {!review.is_approved && (
                    <button
                      onClick={() => handleApprove(review.id)}
                      className="p-2 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors cursor-pointer"
                      title="Aprovar"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  )}
                  {review.is_approved && (
                    <button
                      onClick={() => handleReject(review.id)}
                      className="p-2 text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors cursor-pointer"
                      title="Desaprovar"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(review.id)}
                    className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                    title="Excluir"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

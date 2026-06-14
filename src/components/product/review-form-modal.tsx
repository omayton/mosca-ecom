"use client"

import { useState } from "react"
import { Star, X, CheckCircle } from "lucide-react"

interface ReviewFormModalProps {
  productId: number
  productName: string
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function ReviewFormModal({ productId, productName, isOpen, onClose, onSuccess }: ReviewFormModalProps) {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [title, setTitle] = useState("")
  const [comment, setComment] = useState("")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (rating === 0) {
      setError("Selecione uma nota de avaliação")
      return
    }
    if (!name.trim() || !email.trim()) {
      setError("Preencha nome e email")
      return
    }

    setSubmitting(true)
    setError("")

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          rating,
          title: title.trim(),
          comment: comment.trim(),
          user_name: name.trim(),
          user_email: email.trim(),
        }),
      })

      if (res.ok) {
        setSubmitted(true)
        setTimeout(() => {
          onSuccess()
          onClose()
          // Reset form
          setRating(0)
          setHoverRating(0)
          setTitle("")
          setComment("")
          setName("")
          setEmail("")
          setSubmitted(false)
        }, 2000)
      } else {
        const data = await res.json()
        setError(data.error || "Erro ao enviar avaliação")
      }
    } catch {
      setError("Erro ao enviar avaliação. Tente novamente.")
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-zinc-100 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-zinc-900 text-lg">Avaliar produto</h2>
            <p className="text-sm text-zinc-500">{productName}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="p-2 hover:bg-zinc-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-zinc-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {submitted ? (
            <div className="text-center py-8">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="font-bold text-zinc-900 text-xl mb-2">Avaliação enviada!</h3>
              <p className="text-zinc-600">Obrigado por compartilhar sua opinião.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Error */}
              {error && (
                <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              {/* Rating */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Sua avaliação <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      aria-label={`${star} estrelas`}
                      className="p-1 transition-transform hover:scale-110"
                    >
                      <Star
                        className={`h-8 w-8 ${
                          star <= (hoverRating || rating)
                            ? "text-amber-400 fill-amber-400"
                            : "text-zinc-200"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                {rating > 0 && (
                  <p className="text-sm text-zinc-600 mt-2">
                    {rating === 1 && "Muito ruim"}
                    {rating === 2 && "Ruim"}
                    {rating === 3 && "Regular"}
                    {rating === 4 && "Muito bom"}
                    {rating === 5 && "Excelente"}
                  </p>
                )}
              </div>

              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-zinc-700 mb-2">
                  Título da avaliação
                </label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Produto de qualidade"
                  maxLength={100}
                  className="w-full px-4 py-3 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                />
              </div>

              {/* Comment */}
              <div>
                <label htmlFor="comment" className="block text-sm font-medium text-zinc-700 mb-2">
                  Comentário
                </label>
                <textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Conte sua experiência com o produto..."
                  rows={4}
                  maxLength={500}
                  className="w-full px-4 py-3 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all resize-none"
                />
                <p className="text-xs text-zinc-400 mt-1 text-right">
                  {comment.length}/500
                </p>
              </div>

              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-zinc-700 mb-2">
                  Seu nome <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome completo"
                  required
                  className="w-full px-4 py-3 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-zinc-700 mb-2">
                  Seu email <span className="text-red-500">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="w-full px-4 py-3 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                />
                <p className="text-xs text-zinc-400 mt-1">
                  Não publicaremos seu email
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={submitting}
                  className="flex-1 px-6 py-3 border border-zinc-200 text-zinc-700 font-medium rounded-lg hover:bg-zinc-50 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-6 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? "Enviando..." : "Enviar avaliação"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Star, BadgeCheck } from "lucide-react"

interface Review {
  id: number
  user_name: string
  rating: number
  title: string
  comment: string
  is_verified_purchase: boolean
  created_at: string
}

interface ReviewStats {
  count: number
  avgRating: number
}

interface ProductReviewsProps {
  productId: number
}

function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "lg" }) {
  const sizeClass = size === "lg" ? "h-5 w-5" : "h-4 w-4"
  return (
    <div className="flex gap-0.5" aria-label={`${rating} de 5 estrelas`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${sizeClass} ${star <= rating ? "text-amber-400 fill-amber-400" : "text-zinc-200"}`}
          aria-hidden="true"
        />
      ))}
    </div>
  )
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" })
}

export function ProductReviews({ productId }: ProductReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [stats, setStats] = useState<ReviewStats>({ count: 0, avgRating: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchReviews() {
      try {
        const res = await fetch(`/api/reviews?productId=${productId}`)
        if (res.ok) {
          const data = await res.json()
          setReviews(data.reviews || [])
          setStats(data.stats || { count: 0, avgRating: 0 })
        }
      } catch {} finally {
        setLoading(false)
      }
    }
    fetchReviews()
  }, [productId])

  if (loading) return null
  if (reviews.length === 0) return null

  return (
    <div className="mt-12 pt-8 border-t border-zinc-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-bold text-zinc-900 text-lg">Avaliações</h2>
        <div className="flex items-center gap-2">
          <StarRating rating={Math.round(stats.avgRating)} size="sm" />
          <span className="text-sm text-zinc-600 font-medium">
            {stats.avgRating.toFixed(1)} ({stats.count} {stats.count === 1 ? "avaliação" : "avaliações"})
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {reviews.map((review) => (
          <div
            key={review.id}
            className="bg-zinc-50/60 border border-zinc-100 rounded-xl p-4"
          >
            <div className="flex items-start gap-3">
              {/* Avatar */}
              <div className="w-9 h-9 rounded-full bg-zinc-200 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-zinc-600">
                  {getInitials(review.user_name)}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-zinc-800">{review.user_name}</span>
                  {review.is_verified_purchase && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded-full">
                      <BadgeCheck className="h-3 w-3" aria-hidden="true" />
                      Compra verificada
                    </span>
                  )}
                  <span className="text-xs text-zinc-400">{formatDate(review.created_at)}</span>
                </div>

                <div className="mt-1">
                  <StarRating rating={review.rating} />
                </div>

                {review.title && (
                  <p className="text-sm font-medium text-zinc-800 mt-2">{review.title}</p>
                )}
                {review.comment && (
                  <p className="text-sm text-zinc-600 mt-1 leading-relaxed">{review.comment}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

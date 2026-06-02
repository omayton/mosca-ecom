"use client"

import { useState, useEffect } from "react"
import { Ticket, Copy, Check } from "lucide-react"

interface Coupon {
  id: number
  code: string
  description: string
  discount_type: "percentage" | "fixed"
  discount_value: number
}

interface ProductCouponsProps {
  productId: number
  categorySlug: string
}

export function ProductCoupons({ productId, categorySlug }: ProductCouponsProps) {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [copiedId, setCopiedId] = useState<number | null>(null)

  useEffect(() => {
    async function fetchCoupons() {
      try {
        const res = await fetch(`/api/coupons/product?productId=${productId}&category=${categorySlug}`)
        if (res.ok) {
          const data = await res.json()
          setCoupons(data.coupons || [])
        }
      } catch {}
    }
    fetchCoupons()
  }, [productId, categorySlug])

  function handleCopy(coupon: Coupon) {
    navigator.clipboard.writeText(coupon.code)
    setCopiedId(coupon.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  if (coupons.length === 0) return null

  return (
    <div className="space-y-2 mb-5">
      {coupons.map((coupon) => (
        <button
          key={coupon.id}
          onClick={() => handleCopy(coupon)}
          className="w-full flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 group hover:border-amber-300 transition-colors cursor-pointer"
        >
          <Ticket className="h-4 w-4 text-amber-600 flex-shrink-0" aria-hidden="true" />
          <div className="flex-1 text-left min-w-0">
            <span className="text-sm font-bold text-amber-800 tracking-wide">
              {coupon.code}
            </span>
            <span className="text-xs text-amber-700 ml-2">
              {coupon.discount_type === "percentage"
                ? `${coupon.discount_value}% OFF`
                : `R$ ${coupon.discount_value.toFixed(2)} OFF`}
            </span>
            {coupon.description && (
              <p className="text-xs text-amber-600 truncate mt-0.5">{coupon.description}</p>
            )}
          </div>
          <div className="flex-shrink-0 text-amber-600 group-hover:text-amber-800 transition-colors">
            {copiedId === coupon.id ? (
              <Check className="h-4 w-4 text-emerald-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </div>
        </button>
      ))}
    </div>
  )
}

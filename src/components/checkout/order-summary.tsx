"use client"

import { useState } from "react"
import { CartItem } from "@/contexts/cart-context"
import { imgUrl, fmt, pixPrice } from "@/lib/products"
import { ShippingOption } from "./shipping-selector"
import Image from "next/image"
import { Ticket, Loader2, X, Check } from "lucide-react"

interface CouponData {
  code: string
  discount_type: "percentage" | "fixed"
  discount_value: number
}

interface OrderSummaryProps {
  items: CartItem[]
  shipping: ShippingOption | null
  onCouponApplied?: (coupon: CouponData | null) => void
}

export function OrderSummary({ items, shipping, onCouponApplied }: OrderSummaryProps) {
  const [couponCode, setCouponCode] = useState("")
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponError, setCouponError] = useState("")
  const [appliedCoupon, setAppliedCoupon] = useState<CouponData | null>(null)

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const shippingCost = shipping?.price || 0

  let discount = 0
  if (appliedCoupon) {
    if (appliedCoupon.discount_type === "percentage") {
      discount = Math.round(subtotal * (appliedCoupon.discount_value / 100) * 100) / 100
    } else {
      discount = Math.min(appliedCoupon.discount_value, subtotal)
    }
  }

  const total = subtotal - discount + shippingCost
  const totalPix = pixPrice(subtotal - discount) + shippingCost

  async function handleApplyCoupon() {
    if (!couponCode.trim()) return
    setCouponLoading(true)
    setCouponError("")

    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode.trim().toUpperCase(), subtotal }),
      })
      const data = await res.json()

      if (!res.ok) {
        setCouponError(data.error || "Cupom inválido")
        return
      }

      const coupon: CouponData = {
        code: data.code,
        discount_type: data.discount_type,
        discount_value: data.discount_value,
      }
      setAppliedCoupon(coupon)
      onCouponApplied?.(coupon)
    } catch {
      setCouponError("Erro ao validar cupom")
    } finally {
      setCouponLoading(false)
    }
  }

  function handleRemoveCoupon() {
    setAppliedCoupon(null)
    setCouponCode("")
    setCouponError("")
    onCouponApplied?.(null)
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-zinc-900">Itens do pedido</h3>
        <div className="divide-y divide-zinc-100">
          {items.map((item) => (
            <div key={item.productId} className="flex items-center gap-3 py-3">
              <div className="w-14 h-14 bg-zinc-100 rounded-lg overflow-hidden flex-shrink-0">
                <Image
                  src={imgUrl(item.imageFile)}
                  alt={item.name}
                  width={56}
                  height={56}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-zinc-900 truncate">{item.name}</p>
                <p className="text-xs text-zinc-500">Qtd: {item.quantity}</p>
              </div>
              <span className="font-bold text-sm text-zinc-900">
                R$ {fmt(item.price * item.quantity)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Coupon field */}
      <div className="border border-zinc-100 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <Ticket className="h-4 w-4 text-zinc-500" aria-hidden="true" />
          <span className="text-sm font-medium text-zinc-700">Cupom de desconto</span>
        </div>

        {appliedCoupon ? (
          <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2.5">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-emerald-600" aria-hidden="true" />
              <span className="text-sm font-bold text-emerald-800">{appliedCoupon.code}</span>
              <span className="text-xs text-emerald-600">
                {appliedCoupon.discount_type === "percentage"
                  ? `−${appliedCoupon.discount_value}%`
                  : `−R$ ${fmt(appliedCoupon.discount_value)}`}
              </span>
            </div>
            <button
              onClick={handleRemoveCoupon}
              className="text-emerald-600 hover:text-red-600 transition-colors cursor-pointer"
              aria-label="Remover cupom"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              value={couponCode}
              onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponError("") }}
              onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
              placeholder="Digite seu cupom"
              className="flex-1 border border-zinc-200 rounded-lg px-3 py-2.5 text-sm uppercase placeholder:normal-case focus:outline-none focus:border-zinc-400 transition-colors"
            />
            <button
              onClick={handleApplyCoupon}
              disabled={couponLoading || !couponCode.trim()}
              className="px-4 py-2.5 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              {couponLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Aplicar"}
            </button>
          </div>
        )}

        {couponError && (
          <p className="text-xs text-red-600 mt-2">{couponError}</p>
        )}
      </div>

      {shipping && (
        <div className="bg-zinc-50 rounded-xl p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-zinc-600">Subtotal</span>
            <span className="text-zinc-900">R$ {fmt(subtotal)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-emerald-600">Desconto ({appliedCoupon?.code})</span>
              <span className="text-emerald-600 font-medium">−R$ {fmt(discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-zinc-600">Frete ({shipping.company})</span>
            <span className="text-zinc-900">R$ {fmt(shippingCost)}</span>
          </div>
          <div className="border-t border-zinc-200 pt-2 flex justify-between">
            <span className="font-semibold text-zinc-900">Total</span>
            <span className="font-bold text-lg text-zinc-900">R$ {fmt(total)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-green-600">No PIX (5% off produtos)</span>
            <span className="text-green-600 font-semibold">R$ {fmt(totalPix)}</span>
          </div>
        </div>
      )}
    </div>
  )
}

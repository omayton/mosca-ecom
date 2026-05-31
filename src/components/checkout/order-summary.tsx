"use client"

import { CartItem } from "@/contexts/cart-context"
import { imgUrl, fmt, pixPrice } from "@/lib/products"
import { ShippingOption } from "./shipping-selector"
import Image from "next/image"

interface OrderSummaryProps {
  items: CartItem[]
  shipping: ShippingOption | null
}

export function OrderSummary({ items, shipping }: OrderSummaryProps) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const shippingCost = shipping?.price || 0
  const total = subtotal + shippingCost
  const totalPix = pixPrice(subtotal) + shippingCost

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <h3 className="font-inter text-sm font-semibold text-zinc-900">Itens do pedido</h3>
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
                <p className="font-inter text-sm text-zinc-900 truncate">{item.name}</p>
                <p className="font-inter text-xs text-zinc-500">Qtd: {item.quantity}</p>
              </div>
              <span className="font-barlow font-bold text-sm text-zinc-900">
                R$ {fmt(item.price * item.quantity)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {shipping && (
        <div className="bg-zinc-50 rounded-xl p-4 space-y-2">
          <div className="flex justify-between font-inter text-sm">
            <span className="text-zinc-600">Subtotal</span>
            <span className="text-zinc-900">R$ {fmt(subtotal)}</span>
          </div>
          <div className="flex justify-between font-inter text-sm">
            <span className="text-zinc-600">Frete ({shipping.company})</span>
            <span className="text-zinc-900">R$ {fmt(shippingCost)}</span>
          </div>
          <div className="border-t border-zinc-200 pt-2 flex justify-between font-inter">
            <span className="font-semibold text-zinc-900">Total</span>
            <span className="font-barlow font-bold text-lg text-zinc-900">R$ {fmt(total)}</span>
          </div>
          <div className="flex justify-between font-inter text-sm">
            <span className="text-green-600">No PIX (5% off produtos)</span>
            <span className="text-green-600 font-semibold">R$ {fmt(totalPix)}</span>
          </div>
        </div>
      )}
    </div>
  )
}

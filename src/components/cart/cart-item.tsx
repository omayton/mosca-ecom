"use client"

import { Minus, Plus, Trash2 } from "lucide-react"
import { useCart, CartItem as CartItemType } from "@/contexts/cart-context"
import { imgUrl, fmt } from "@/lib/products"
import { ProductImage } from "@/components/product-image"

export function CartItemCard({ item }: { item: CartItemType }) {
  const { updateQuantity, removeItem } = useCart()

  return (
    <div className="flex gap-3 py-4 border-b border-zinc-100 last:border-0">
      <a href={`/produto/${item.slug}`} className="flex-shrink-0">
        <div className="relative w-16 h-16 bg-zinc-50 border border-zinc-100 overflow-hidden rounded-lg">
          <ProductImage
            src={imgUrl(item.imageFile)}
            alt={item.name}
            fill
            className="object-contain p-1"
            sizes="64px"
          />
        </div>
      </a>

      <div className="flex-1 min-w-0">
        <a href={`/produto/${item.slug}`}>
          <h3 className="font-inter text-sm text-zinc-800 font-medium leading-snug line-clamp-2">
            {item.name}
          </h3>
        </a>
        <p className="font-barlow font-bold text-zinc-900 text-sm mt-1">
          R$ {fmt(item.price * item.quantity)}
        </p>

        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
            aria-label="Diminuir quantidade"
            className="w-7 h-7 flex items-center justify-center border border-zinc-200 hover:border-zinc-400 text-zinc-600 transition-colors rounded-md cursor-pointer"
          >
            <Minus className="h-3 w-3" aria-hidden="true" />
          </button>
          <span className="font-inter text-sm text-zinc-800 w-6 text-center">{item.quantity}</span>
          <button
            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
            aria-label="Aumentar quantidade"
            className="w-7 h-7 flex items-center justify-center border border-zinc-200 hover:border-zinc-400 text-zinc-600 transition-colors rounded-md cursor-pointer"
          >
            <Plus className="h-3 w-3" aria-hidden="true" />
          </button>
          <button
            onClick={() => removeItem(item.productId)}
            aria-label={`Remover ${item.name}`}
            className="ml-auto w-7 h-7 flex items-center justify-center text-zinc-400 hover:text-red-600 transition-colors cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  )
}

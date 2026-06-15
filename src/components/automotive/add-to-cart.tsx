"use client"

import { useState } from "react"
import { ShoppingCart, Check, Minus, Plus, Zap } from "lucide-react"
import { useCart } from "@/contexts/cart-context"
import { useRouter } from "next/navigation"
import { trackAddToCart } from "@/lib/analytics"

interface AddToCartProps {
  productId: number
  name: string
  price: number
  imageFile: string
  slug: string
  weight?: string
  dimensions?: string
}

export function AddToCart({ productId, name, price, imageFile, slug, weight, dimensions }: AddToCartProps) {
  const [state, setState] = useState<"idle" | "added">("idle")
  const [qty, setQty] = useState(1)
  const { addItem } = useCart()
  const router = useRouter()

  function handleAddToCart() {
    for (let i = 0; i < qty; i++) {
      addItem({ productId, name, price, imageFile, slug, weight, dimensions })
    }
    trackAddToCart({ name, id: productId, price, quantity: qty })
    setState("added")
    setTimeout(() => setState("idle"), 2500)
  }

  function handleBuyNow() {
    for (let i = 0; i < qty; i++) {
      addItem({ productId, name, price, imageFile, slug, weight, dimensions })
    }
    router.push("/checkout")
  }

  return (
    <div className="space-y-3">
      {/* Quantity selector */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-zinc-600">Quantidade:</span>
        <div className="flex items-center border border-zinc-200 rounded-lg overflow-hidden">
          <button
            onClick={() => setQty(Math.max(1, qty - 1))}
            disabled={qty <= 1}
            aria-label="Diminuir quantidade"
            className="w-10 h-10 flex items-center justify-center text-zinc-600 hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-12 h-10 flex items-center justify-center font-bold text-zinc-900 text-sm border-x border-zinc-200">
            {qty}
          </span>
          <button
            onClick={() => setQty(qty + 1)}
            aria-label="Aumentar quantidade"
            className="w-10 h-10 flex items-center justify-center text-zinc-600 hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col gap-2.5">
        <button
          onClick={handleAddToCart}
          disabled={state === "added"}
          aria-label={state === "added" ? `${name} adicionado ao carrinho` : `Adicionar ${name} ao carrinho`}
          className={`w-full flex items-center justify-center gap-2.5 font-semibold text-sm px-8 py-3.5 min-h-[52px] transition-all duration-300 rounded-lg ${
            state === "added"
              ? "bg-emerald-600 text-white cursor-default"
              : "bg-zinc-900 hover:bg-zinc-800 active:scale-[0.98] text-white cursor-pointer"
          }`}
        >
          {state === "added" ? (
            <>
              <Check className="h-5 w-5" aria-hidden="true" />
              Adicionado ao carrinho!
            </>
          ) : (
            <>
              <ShoppingCart className="h-5 w-5" aria-hidden="true" />
              Adicionar ao Carrinho
            </>
          )}
        </button>

        <button
          onClick={handleBuyNow}
          aria-label="Comprar agora"
          className="w-full flex items-center justify-center gap-2.5 font-semibold text-sm px-8 py-3.5 min-h-[52px] bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-white transition-all duration-300 rounded-lg cursor-pointer"
        >
          <Zap className="h-5 w-5" aria-hidden="true" />
          Comprar Agora
        </button>
      </div>
    </div>
  )
}

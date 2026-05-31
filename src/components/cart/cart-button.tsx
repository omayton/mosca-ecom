"use client"

import { ShoppingCart } from "lucide-react"
import { useCart } from "@/contexts/cart-context"

export function CartButton() {
  const { totalItems, setIsOpen, loaded } = useCart()

  return (
    <button
      onClick={() => setIsOpen(true)}
      aria-label="Ver carrinho"
      className="flex items-center gap-2 text-zinc-300 hover:text-white px-3 py-2 min-h-[44px] transition-colors duration-150 cursor-pointer"
    >
      <div className="relative">
        <ShoppingCart className="h-5 w-5 text-zinc-400" aria-hidden="true" />
        {loaded && totalItems > 0 && (
          <span
            aria-hidden="true"
            className="absolute -top-2 -right-2 bg-red-600 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center"
          >
            {totalItems}
          </span>
        )}
      </div>
      <div className="text-xs leading-tight hidden lg:block">
        <p className="text-zinc-500">Ver meu</p>
        <p className="font-semibold">Carrinho</p>
      </div>
    </button>
  )
}

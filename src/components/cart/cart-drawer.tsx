"use client"

import { useCart } from "@/contexts/cart-context"
import { CartItemCard } from "./cart-item"
import { CartSummary } from "./cart-summary"
import { X, ShoppingBag } from "lucide-react"

export function CartDrawer() {
  const { items, isOpen, setIsOpen } = useCart()

  if (!isOpen) return null

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-zinc-950/50 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />
      <aside
        role="dialog"
        aria-label="Carrinho de compras"
        className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-md bg-white shadow-xl flex flex-col"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
          <h2 className="font-inter font-bold text-zinc-900 text-lg">Carrinho</h2>
          <button
            onClick={() => setIsOpen(false)}
            aria-label="Fechar carrinho"
            className="w-10 h-10 flex items-center justify-center text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer rounded-lg"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
            <ShoppingBag className="h-12 w-12 text-zinc-300 mb-4" aria-hidden="true" />
            <p className="font-inter text-zinc-600 font-medium mb-1">Seu carrinho está vazio</p>
            <p className="font-inter text-sm text-zinc-400">Adicione produtos para continuar</p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6">
              {items.map((item) => (
                <CartItemCard key={item.productId} item={item} />
              ))}
            </div>
            <div className="px-6 pb-6">
              <CartSummary />
            </div>
          </>
        )}
      </aside>
    </>
  )
}

"use client"

import { useCart } from "@/contexts/cart-context"
import { fmt, pixPrice } from "@/lib/products"

export function CartSummary() {
  const { totalPrice, totalItems } = useCart()
  const pix = pixPrice(totalPrice)

  return (
    <div className="border-t border-zinc-200 pt-4 mt-4 space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-zinc-500">{totalItems} {totalItems === 1 ? "item" : "itens"}</span>
        <span className="text-zinc-800 font-medium">R$ {fmt(totalPrice)}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-green-700 font-medium">No PIX (5% off)</span>
        <span className="text-green-700 font-bold">R$ {fmt(pix)}</span>
      </div>
      <a
        href="/checkout"
        className="block w-full text-center bg-red-600 hover:bg-red-700 text-white font-semibold text-sm px-6 py-3.5 min-h-[48px] leading-[48px] transition-colors duration-200 cursor-pointer rounded-xl mt-4"
      >
        Finalizar compra
      </a>
      <p className="text-xs text-zinc-400 text-center mt-2">
        Frete calculado no checkout
      </p>
    </div>
  )
}

"use client"

import { useState } from "react"
import { ShoppingCart, Check } from "lucide-react"

export function AddToCart({ name, price }: { name: string; price: number }) {
  const [state, setState] = useState<"idle" | "added">("idle")

  function handleClick() {
    setState("added")
    setTimeout(() => setState("idle"), 2500)
  }

  return (
    <button
      onClick={handleClick}
      disabled={state === "added"}
      aria-label={state === "added" ? `${name} adicionado ao carrinho` : `Adicionar ${name} ao carrinho`}
      className={`w-full flex items-center justify-center gap-2.5 font-inter font-semibold text-sm px-8 py-3.5 min-h-[52px] transition-all duration-300 rounded-xl ${
        state === "added"
          ? "bg-green-600 text-white cursor-default"
          : "bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white cursor-pointer"
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
  )
}

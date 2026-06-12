"use client"

import Image from "next/image"
import { Lock } from "lucide-react"

export function CheckoutHeader() {
  return (
    <header className="sticky top-0 z-50 bg-zinc-950 shadow-sm">
      <div className="container mx-auto px-4 flex items-center justify-between h-14">
        <a href="/" aria-label="Mosca Branca Parts — Página inicial">
          <Image
            src="/images/05/bannermosca-600x180.png" unoptimized
            alt="Mosca Branca Parts"
            width={120}
            height={64}
            className="h-8 w-auto object-contain"
          />
        </a>
        <div className="flex items-center gap-2 text-zinc-300">
          <Lock className="h-4 w-4 text-green-500" aria-hidden="true" />
          <span className="text-sm font-medium">Compra Segura</span>
        </div>
      </div>
    </header>
  )
}

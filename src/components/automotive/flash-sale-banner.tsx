"use client"

import { useState, useEffect } from "react"
import { Zap, ArrowRight, Flame } from "lucide-react"
import { ProductImage } from "@/components/product-image"
import { imgUrl, fmt } from "@/lib/products"

interface SaleProduct {
  id: number
  slug: string
  name: string
  imageFile: string
  price: number
  oldPrice: number
  inStock: boolean
}

interface ActiveSale {
  active: boolean
  flashSale?: {
    title: string
    description: string | null
    discountPercent: number
    endsAt: string
  }
  products?: SaleProduct[]
}

function useCountdown(endsAt: string | undefined) {
  const [remaining, setRemaining] = useState<number>(() => endsAt ? Math.max(0, new Date(endsAt).getTime() - Date.now()) : 0)
  useEffect(() => {
    if (!endsAt) return
    const t = setInterval(() => {
      setRemaining(Math.max(0, new Date(endsAt).getTime() - Date.now()))
    }, 1000)
    return () => clearInterval(t)
  }, [endsAt])
  return remaining
}

function pad(n: number) { return String(n).padStart(2, "0") }

export function FlashSaleBanner() {
  const [sale, setSale] = useState<ActiveSale | null>(null)

  useEffect(() => {
    fetch("/api/flash-sales/active")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d?.active) setSale(d) })
      .catch(() => {})
  }, [])

  const remaining = useCountdown(sale?.flashSale?.endsAt)

  if (!sale?.active || !sale.flashSale) return null
  const flashSale = sale.flashSale
  const products = sale.products || []
  const hours = Math.floor(remaining / 3600000)
  const minutes = Math.floor((remaining % 3600000) / 60000)
  const seconds = Math.floor((remaining % 60000) / 1000)

  return (
    <section aria-label="Oferta Relâmpago" className="bg-zinc-950 border-y border-amber-500/20">
      {/* Banner strip */}
      <div className="bg-gradient-to-r from-red-700 via-red-600 to-amber-600">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 text-white">
            <div className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center animate-pulse">
              <Flame className="h-5 w-5" />
            </div>
            <div>
              <p className="font-black text-sm sm:text-base leading-tight flex items-center gap-2">
                <Zap className="h-4 w-4" />
                {flashSale.title}
              </p>
              {flashSale.description && (
                <p className="text-[11px] text-white/80 leading-tight hidden sm:block">{flashSale.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="bg-white text-red-700 font-black text-xs px-2.5 py-1 rounded-full">
              -{flashSale.discountPercent}% OFF
            </span>
            {/* Countdown */}
            <div className="flex items-center gap-1.5 text-white">
              <span className="text-[10px] uppercase tracking-wider text-white/70 hidden sm:block">Termina em</span>
              <div className="flex items-center gap-1 font-mono font-bold">
                <span className="bg-black/30 rounded px-1.5 py-1 text-sm tabular-nums min-w-[2ch] text-center">{pad(hours)}</span>
                <span className="text-white/60">:</span>
                <span className="bg-black/30 rounded px-1.5 py-1 text-sm tabular-nums min-w-[2ch] text-center">{pad(minutes)}</span>
                <span className="text-white/60">:</span>
                <span className="bg-black/30 rounded px-1.5 py-1 text-sm tabular-nums min-w-[2ch] text-center">{pad(seconds)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Products */}
      {products.length > 0 && (
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {products.slice(0, 5).map((p) => (
              <a
                key={p.id}
                href={`/produto/${p.slug}`}
                className="bg-white rounded-xl overflow-hidden border border-zinc-100 group hover:shadow-lg hover:border-amber-300 transition-all duration-300 cursor-pointer flex flex-col"
              >
                <div className="relative aspect-[4/3] bg-gradient-to-b from-zinc-50 to-white overflow-hidden">
                  <ProductImage
                    src={imgUrl(p.imageFile)}
                    alt={p.name}
                    fill
                    sizes="(max-width: 768px) 50vw, 20vw"
                    className="object-contain p-3 group-hover:scale-105 transition-transform duration-500"
                  />
                  <span className="absolute top-2 left-2 bg-red-600 text-white font-bold text-[10px] px-2 py-0.5 rounded">
                    -{flashSale.discountPercent}%
                  </span>
                </div>
                <div className="p-3 flex flex-col flex-1">
                  <h3
                    className="text-zinc-800 font-medium leading-snug flex-1 mb-2"
                    style={{ fontSize: "12px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}
                  >
                    {p.name}
                  </h3>
                  <p className="text-zinc-400 line-through" style={{ fontSize: "11px" }}>R$ {fmt(p.oldPrice)}</p>
                  <p className="font-black text-red-600 leading-none" style={{ fontSize: "18px" }}>R$ {fmt(p.price)}</p>
                </div>
              </a>
            ))}
          </div>
          <div className="text-center mt-6">
            <a
              href="/loja"
              className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm px-8 py-3 min-h-[44px] transition-all duration-200 rounded-xl"
            >
              Ver todas as ofertas <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      )}
    </section>
  )
}

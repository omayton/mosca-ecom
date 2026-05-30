"use client"

import { useRef } from "react"
import Image from "next/image"
import { Heart, ChevronLeft, ChevronRight } from "lucide-react"
import { FEATURED, RECENT, type Product, imgUrl, pixPrice, installmentPrice, fmt } from "@/lib/products"

function ProductCard({ p }: { p: Product }) {
  const pix    = pixPrice(p.price)
  const parcel = installmentPrice(p.price, 3)

  return (
    <article
      aria-label={p.name}
      className="bg-white border border-zinc-100 flex flex-col group hover:shadow-md hover:border-zinc-200 transition-all duration-300 rounded-xl"
      style={{ width: "220px", height: "380px", flexShrink: 0 }}
    >
      {/* ── Imagem — 150px fixo ───────────────────────── */}
      <a
        href={`/produto/${p.slug}`}
        className="relative block overflow-hidden bg-zinc-50/80 rounded-t-xl"
        style={{ height: "160px", flexShrink: 0 }}
        tabIndex={-1}
        aria-hidden="true"
      >
        <Image
          src={imgUrl(p.imageFile)}
          alt={p.name}
          fill
          sizes="220px"
          className="object-contain p-4 group-hover:scale-103 transition-transform duration-500 ease-out"
        />

        {/* Badges dentro da imagem */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 pointer-events-none">
          <span className="bg-red-50 text-red-700 font-inter font-semibold leading-none px-2.5 py-1 rounded-md" style={{ fontSize: "10px" }}>
            RARO
          </span>
          <span className="bg-green-50 text-green-700 font-inter font-semibold leading-none px-2.5 py-1 rounded-md" style={{ fontSize: "10px" }}>
            5% PIX
          </span>
        </div>

        {/* Wishlist */}
        <button
          aria-label={`Favoritar ${p.name}`}
          onClick={(e) => e.stopPropagation()}
          className="absolute top-2 right-2 flex items-center justify-center w-9 h-9 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all duration-200"
        >
          <Heart className="h-5 w-5" aria-hidden="true" />
        </button>
      </a>

      {/* ── Info — flex-1 ─────────────────────────────── */}
      <a
        href={`/produto/${p.slug}`}
        className="flex flex-col flex-1 p-3 min-h-0"
        aria-label={`Ver ${p.name}`}
      >
        {/* Categoria */}
        <p className="font-inter text-zinc-400 uppercase tracking-wider mb-1.5" style={{ fontSize: "10px" }}>
          {p.category}
        </p>

        {/* Nome — clamp 3 linhas, ocupa espaço disponível */}
        <h3
          className="font-inter text-zinc-800 leading-snug flex-1 overflow-hidden"
          style={{ fontSize: "13px", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}
        >
          {p.name}
        </h3>

        {/* Bloco de preço — altura fixa, sempre na base */}
        <div className="flex-shrink-0 pt-3 border-t border-zinc-100 mt-2">
          {/* Preço antigo (se houver) */}
          {p.oldPrice && (
            <p className="font-inter text-zinc-400 line-through" style={{ fontSize: "11px" }}>
              R$ {fmt(p.oldPrice)}
            </p>
          )}

          {/* Preço PIX */}
          <p className="font-barlow font-black text-zinc-900 leading-none" style={{ fontSize: "20px" }}>
            R$ {fmt(pix)}
          </p>

          {/* Parcelas */}
          <p className="font-inter text-zinc-500 mt-1" style={{ fontSize: "11px" }}>
            ou {" "}
            <span className="font-semibold text-zinc-700">3x R$ {fmt(parcel)}</span>
            {" "}sem juros
          </p>
        </div>
      </a>
    </article>
  )
}

function Carousel({ products, label }: { products: Product[]; label: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const scroll = (dir: "left" | "right") =>
    ref.current?.scrollBy({ left: dir === "right" ? 240 : -240, behavior: "smooth" })

  return (
    <section aria-label={label} className="bg-white py-10 border-t border-zinc-100">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-inter font-bold text-zinc-900 text-lg">{label}</h2>
          <div className="flex items-center gap-2">
            {(["left", "right"] as const).map((dir) => (
              <button
                key={dir}
                onClick={() => scroll(dir)}
                aria-label={dir === "left" ? "Produtos anteriores" : "Próximos produtos"}
                className="border border-zinc-200 flex items-center justify-center text-zinc-500 hover:border-zinc-400 hover:text-zinc-700 hover:bg-zinc-50 transition-all duration-200 rounded-lg"
                style={{ width: "44px", height: "44px" }}
              >
                {dir === "left"
                  ? <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                  : <ChevronRight className="h-5 w-5" aria-hidden="true" />}
              </button>
            ))}
          </div>
        </div>

        <div
          ref={ref}
          role="list"
          aria-label={label}
          className="flex gap-4 overflow-x-auto pb-3"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {products.map((p) => (
            <div key={p.id} role="listitem">
              <ProductCard p={p} />
            </div>
          ))}
        </div>

        <div className="text-center mt-6">
          <a
            href="/loja"
            className="inline-flex items-center gap-2 border border-zinc-200 text-zinc-600 font-inter font-medium text-sm px-8 py-3 min-h-[44px] hover:border-zinc-400 hover:text-zinc-800 transition-all duration-200 rounded-lg"
          >
            Ver todos os produtos
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  )
}

export function ProductSection() {
  return (
    <>
      <Carousel products={FEATURED} label="Peças em destaque" />
      <Carousel products={RECENT}   label="Mais recentes" />
    </>
  )
}

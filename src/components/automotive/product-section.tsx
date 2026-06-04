"use client"

import { Heart, ChevronRight, Eye, ShoppingCart } from "lucide-react"
import { type Product, imgUrl, pixPrice, installmentPrice, fmt } from "@/lib/products"
import { ProductImage } from "@/components/product-image"
import { useCart } from "@/contexts/cart-context"

function ProductCard({ p }: { p: Product }) {
  const pix    = pixPrice(p.price)
  const parcel = installmentPrice(p.price, 3)
  const { addItem } = useCart()
  const discount = p.oldPrice && p.oldPrice > p.price
    ? Math.round((1 - p.price / p.oldPrice) * 100)
    : null

  return (
    <article
      aria-label={p.name}
      className="bg-white border border-zinc-100 flex flex-col group hover:shadow-lg hover:border-zinc-200 transition-all duration-300 rounded-2xl overflow-hidden"
    >
      {/* Image */}
      <a
        href={`/produto/${p.slug}`}
        className="relative block overflow-hidden bg-gradient-to-b from-zinc-50 to-white aspect-[4/3]"
        tabIndex={-1}
        aria-hidden="true"
      >
        <ProductImage
          src={imgUrl(p.imageFile)}
          alt={p.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-contain p-5 group-hover:scale-105 transition-transform duration-500 ease-out"
        />

        {/* Badges */}
        {discount !== null && (
          <div className="absolute top-3 left-3 flex flex-col gap-1.5 pointer-events-none">
            <span className="bg-red-600 text-white font-bold leading-none px-2 py-1 rounded-md shadow-sm" style={{ fontSize: "10px" }}>
              -{discount}%
            </span>
          </div>
        )}

        {/* Quick actions on hover */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300">
          <button
            aria-label={`Favoritar ${p.name}`}
            onClick={(e) => e.preventDefault()}
            className="w-8 h-8 flex items-center justify-center bg-white shadow-md rounded-full text-zinc-400 hover:text-red-500 hover:scale-110 transition-all duration-200"
          >
            <Heart className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            aria-label={`Visualizar ${p.name}`}
            onClick={(e) => e.preventDefault()}
            className="w-8 h-8 flex items-center justify-center bg-white shadow-md rounded-full text-zinc-400 hover:text-zinc-700 hover:scale-110 transition-all duration-200"
          >
            <Eye className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Add to cart hover overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <button
            onClick={(e) => {
              e.preventDefault()
              addItem({ productId: p.id, name: p.name, price: p.price, imageFile: p.imageFile, slug: p.slug })
            }}
            className="w-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <ShoppingCart className="h-3.5 w-3.5" aria-hidden="true" />
            Adicionar ao Carrinho
          </button>
        </div>
      </a>

      {/* Info */}
      <a
        href={`/produto/${p.slug}`}
        className="flex flex-col flex-1 p-4 min-h-0"
        aria-label={`Ver ${p.name}`}
      >
        {/* Category */}
        <p className="text-red-600 uppercase tracking-wider font-semibold mb-1.5" style={{ fontSize: "10px" }}>
          {p.category}
        </p>

        {/* Name */}
        <h3
          className="text-zinc-800 font-medium leading-snug flex-1 overflow-hidden mb-3"
          style={{ fontSize: "13px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}
        >
          {p.name}
        </h3>

        {/* Price block */}
        <div className="flex-shrink-0 pt-3 border-t border-zinc-100">
          {/* Old price */}
          {p.oldPrice && (
            <p className="text-zinc-400 line-through" style={{ fontSize: "11px" }}>
              R$ {fmt(p.oldPrice)}
            </p>
          )}

          {/* PIX price */}
          <div className="flex items-baseline gap-2">
            <p className="font-black text-zinc-900 leading-none" style={{ fontSize: "22px" }}>
              R$ {fmt(pix)}
            </p>
            <span className="text-green-700 font-bold bg-green-50 px-1.5 py-0.5 rounded" style={{ fontSize: "9px" }}>
              PIX
            </span>
          </div>

          {/* Installments */}
          <p className="text-zinc-500 mt-1.5" style={{ fontSize: "11px" }}>
            ou{" "}
            <span className="font-semibold text-zinc-700">3x R$ {fmt(parcel)}</span>
            {" "}sem juros
          </p>
        </div>
      </a>
    </article>
  )
}

function ProductGrid({ products, label }: { products: Product[]; label: string }) {
  return (
    <section aria-label={label} className="bg-white py-16 border-t border-zinc-100">
      <div className="container mx-auto px-4 lg:px-6">
        <div className="mb-8">
          <h2 className="font-bold text-zinc-900 text-2xl">{label}</h2>
          <p className="text-zinc-500 text-base mt-1.5">Peças selecionadas para o seu veículo</p>
        </div>

        <div
          role="list"
          aria-label={label}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 lg:gap-8"
        >
          {products.map((p) => (
            <div key={p.id} role="listitem">
              <ProductCard p={p} />
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <a
            href="/loja"
            className="inline-flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-base px-10 py-4 min-h-[48px] transition-all duration-200 rounded-xl shadow-sm hover:shadow-md"
          >
            Ver todos os produtos
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  )
}

export function ProductSection({ featured, recent, discount }: { featured: Product[]; recent: Product[]; discount: Product[] }) {
  return (
    <>
      <ProductGrid products={featured} label="Peças em destaque" />
      <ProductGrid products={recent}   label="Adicionadas recentemente" />
      {discount.length > 0 && <ProductGrid products={discount} label="Ofertas especiais" />}
    </>
  )
}

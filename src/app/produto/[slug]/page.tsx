import { notFound } from "next/navigation"
import { TopHeader } from "@/components/automotive/top-header"
import { Footer } from "@/components/footer"
import { AddToCart } from "@/components/automotive/add-to-cart"
import { imgUrl, pixPrice, installmentPrice, fmt, parseWeight, parseDimensions } from "@/lib/products"
import { getProductBySlug, getRelatedProducts, getAllSlugs, getProductImages } from "@/lib/products-db"
import { Heart, Truck, Shield, RefreshCw, ChevronRight, MessageCircle, Package, CreditCard } from "lucide-react"
import { ShippingCalculator } from "@/components/shipping-calculator"
import { ProductImage } from "@/components/product-image"
import { ProductGallery } from "@/components/product/product-gallery"
import { ProductCoupons } from "@/components/product/product-coupons"
import { ProductReviews } from "@/components/product/product-reviews"
import { ProductTracker } from "@/components/product/product-tracker"

export const revalidate = 60

export async function generateStaticParams() {
  const slugs = await getAllSlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const product = await getProductBySlug(params.slug)
  if (!product) return {}

  const imageUrl = imgUrl(product.imageFile)
  const price = `R$ ${fmt(product.price)}`

  return {
    title: product.name,
    description: product.description || `${product.name} — Peça rara automotiva. ${price} com 5% OFF no PIX. Envio para todo o Brasil.`,
    openGraph: {
      title: `${product.name} | Mosca Branca Parts`,
      description: product.description || `${product.name} — ${price} com 5% OFF no PIX.`,
      images: [{ url: imageUrl, alt: product.name }],
      type: 'website',
      url: `https://www.moscabrancaparts.com.br/produto/${product.slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description: product.description || `${product.name} — ${price}`,
      images: [imageUrl],
    },
  }
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await getProductBySlug(params.slug)
  if (!product) notFound()

  const pix      = pixPrice(product.price)
  const parcel3  = installmentPrice(product.price, 3)
  const parcel12 = installmentPrice(product.price, 12)
  const related  = await getRelatedProducts(product, 4)
  const productImages = await getProductImages(product.id)
  const weightNum = parseWeight(product.weight)
  const dims      = parseDimensions(product.dimensions)

  return (
    <div className="min-h-screen bg-zinc-50/50">
      {/* Schema.org Product JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: product.name,
            description: product.description,
            image: imgUrl(product.imageFile),
            brand: { "@type": "Brand", name: "Mosca Branca Parts" },
            category: product.category,
            offers: {
              "@type": "Offer",
              url: `https://www.moscabrancaparts.com.br/produto/${product.slug}`,
              priceCurrency: "BRL",
              price: product.price.toFixed(2),
              availability: product.inStock
                ? "https://schema.org/InStock"
                : "https://schema.org/OutOfStock",
              seller: { "@type": "Organization", name: "Mosca Branca Parts" },
            },
          }),
        }}
      />

      <ProductTracker name={product.name} id={product.id} price={product.price} category={product.category} />
      <TopHeader />

      {/* Breadcrumb */}
      <nav aria-label="Localização" className="bg-white/80 border-b border-zinc-100 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-3.5 flex items-center gap-2 text-xs text-zinc-500 flex-wrap">
          <a href="/" className="hover:text-red-600 transition-colors">Início</a>
          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          <a href={`/loja?categoria=${product.categorySlug}`} className="hover:text-red-600 transition-colors">
            {product.category}
          </a>
          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="text-zinc-800 font-medium line-clamp-1">{product.name}</span>
        </div>
      </nav>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8">
        <div className="bg-white border border-zinc-100 shadow-sm p-6 md:p-10 rounded-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">

            {/* ── IMAGEM ─────────────────────────────────────── */}
            <div>
              <ProductGallery
                mainImage={imgUrl(product.imageFile)}
                productName={product.name}
                images={productImages.map((img) => ({
                  id: img.id,
                  url: img.url,
                  alt: img.altText || product.name,
                }))}
              />

              {/* Share / Wishlist */}
              <div className="flex items-center gap-3 mt-4">
                <button
                  aria-label="Salvar na lista de desejos"
                  className="flex items-center gap-2 border border-zinc-200 text-zinc-600 hover:border-zinc-400 hover:text-zinc-800 hover:bg-zinc-50 text-sm px-4 py-2.5 min-h-[44px] transition-all duration-200 rounded-lg flex-1 justify-center cursor-pointer"
                >
                  <Heart className="h-4 w-4" aria-hidden="true" />
                  Salvar
                </button>
                <a
                  href={`https://wa.me/5534999365936?text=Olá! Tenho interesse no produto: ${encodeURIComponent(product.name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 border border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800 text-sm px-4 py-2.5 min-h-[44px] transition-all duration-200 rounded-lg flex-1 justify-center"
                >
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                  Tirar dúvida
                </a>
              </div>
            </div>

            {/* ── INFO ───────────────────────────────────────── */}
            <div className="flex flex-col">
              {/* Category */}
              <a
                href={`/loja?categoria=${product.categorySlug}`}
                className="inline-block text-xs font-semibold text-red-600 uppercase tracking-widest mb-3 hover:text-red-700 transition-colors"
              >
                {product.category}
              </a>

              {/* Name */}
              <h1 className="font-bold text-zinc-900 text-2xl md:text-3xl leading-tight mb-6">
                {product.name}
              </h1>

              {/* Price block */}
              <div className="bg-zinc-50/80 border border-zinc-100 p-6 mb-6 rounded-xl">
                {/* PIX price */}
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="font-black text-zinc-900 leading-none" style={{ fontSize: "2.2rem" }}>
                    R$ {fmt(pix)}
                  </span>
                  <span className="text-green-700 font-semibold text-sm bg-green-50 px-2.5 py-1 rounded-full">
                    5% OFF no PIX
                  </span>
                </div>

                {/* Normal price */}
                {product.oldPrice ? (
                  <p className="text-sm text-zinc-400 mb-1">
                    De: <span className="line-through">R$ {fmt(product.oldPrice)}</span>{" "}
                    por <span className="text-zinc-700 font-semibold">R$ {fmt(product.price)}</span>
                  </p>
                ) : (
                  <p className="text-sm text-zinc-400 mb-1">
                    Preço normal: <span className="text-zinc-700">R$ {fmt(product.price)}</span>
                  </p>
                )}

                {/* Installments */}
                <p className="text-sm text-zinc-600">
                  ou <span className="font-semibold text-zinc-800">3x de R$ {fmt(parcel3)}</span> sem juros
                </p>
                <p className="text-xs text-zinc-400 mt-0.5">
                  ou 12x de R$ {fmt(parcel12)} com Mercado Crédito
                </p>
              </div>

              {/* Stock */}
              <div className="flex items-center gap-2 mb-5">
                <Package className="h-4 w-4 text-green-600" aria-hidden="true" />
                <span className="text-sm text-green-700 font-medium">
                  {product.inStock ? "Em estoque — pronto para envio" : "Consulte disponibilidade"}
                </span>
              </div>

              {/* Coupons */}
              <ProductCoupons productId={product.id} categorySlug={product.categorySlug} />

              {/* Add to cart */}
              <div className="mb-5">
                <AddToCart
                  productId={product.id}
                  name={product.name}
                  price={product.price}
                  imageFile={product.imageFile}
                  slug={product.slug}
                />
              </div>

              {/* Security seal */}
              <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-4 mb-5">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: Shield, text: "Compra segura" },
                    { icon: Truck, text: "Envio rastreado" },
                    { icon: RefreshCw, text: "Devolução 30 dias" },
                    { icon: CreditCard, text: "PIX, Cartão e Boleto" },
                  ].map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
                        <Icon className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                      </div>
                      <span className="text-xs text-zinc-700 font-medium leading-tight">{text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping calculator */}
              <ShippingCalculator
                weight={weightNum}
                width={dims.width}
                height={dims.height}
                length={dims.length}
                price={product.price}
              />

              {/* Specs */}
              {(product.weight || product.dimensions) && (
                <div className="mt-8 pt-6 border-t border-zinc-100">
                  <h2 className="font-semibold text-zinc-900 text-sm mb-3 uppercase tracking-wide">
                    Especificações
                  </h2>
                  <dl className="space-y-1.5">
                    {product.weight && (
                      <div className="flex gap-4 text-sm">
                        <dt className="text-zinc-500 w-24 flex-shrink-0">Peso</dt>
                        <dd className="text-zinc-800">{product.weight}</dd>
                      </div>
                    )}
                    {product.dimensions && (
                      <div className="flex gap-4 text-sm">
                        <dt className="text-zinc-500 w-24 flex-shrink-0">Dimensões</dt>
                        <dd className="text-zinc-800">{product.dimensions}</dd>
                      </div>
                    )}
                    <div className="flex gap-4 text-sm">
                      <dt className="text-zinc-500 w-24 flex-shrink-0">Categoria</dt>
                      <dd className="text-zinc-800">{product.category}</dd>
                    </div>
                  </dl>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="mt-12 pt-8 border-t border-zinc-100">
            <h2 className="font-bold text-zinc-900 text-lg mb-4">Descrição</h2>
            <p className="text-zinc-600 leading-relaxed max-w-3xl">{product.description}</p>
            <p className="text-zinc-500 text-sm mt-4 italic">
              &ldquo;Peças raras, soluções únicas. Aqui você encontra o que parecia impossível.&rdquo;
            </p>
          </div>

          {/* Reviews */}
          <ProductReviews productId={product.id} />
        </div>

        {/* Related products */}
        {related.length > 0 && (
          <section aria-label="Produtos relacionados" className="mt-8">
            <h2 className="font-bold text-zinc-900 text-lg mb-5">Você também pode gostar</h2>
            <ul className="grid grid-cols-2 md:grid-cols-4 gap-5" role="list">
              {related.map((rel) => (
                <li key={rel.id} role="listitem">
                  <a
                    href={`/produto/${rel.slug}`}
                    className="block bg-white border border-zinc-100 hover:shadow-md hover:border-zinc-200 transition-all duration-300 rounded-xl group"
                    aria-label={rel.name}
                  >
                    <div className="relative aspect-square bg-zinc-50/80 overflow-hidden rounded-t-xl">
                      <ProductImage
                        src={imgUrl(rel.imageFile)}
                        alt={rel.name}
                        fill
                        className="object-contain p-4 group-hover:scale-103 transition-transform duration-500 ease-out"
                        sizes="(max-width: 768px) 50vw, 25vw"
                      />
                    </div>
                    <div className="p-3">
                      <p className="text-xs text-zinc-400 uppercase tracking-wider mb-1" style={{ fontSize: "10px" }}>{rel.category}</p>
                      <h3 className="text-sm text-zinc-800 font-medium leading-snug line-clamp-2 mb-2">
                        {rel.name}
                      </h3>
                      <p className="font-black text-zinc-900 text-lg">
                        R$ {fmt(rel.price)}
                      </p>
                    </div>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>

      <Footer />
    </div>
  )
}

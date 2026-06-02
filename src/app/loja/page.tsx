import { TopHeader } from "@/components/automotive/top-header"
import { Footer } from "@/components/footer"
import { supabase } from "@/lib/supabase"
import { type Product, imgUrl, pixPrice, installmentPrice, fmt } from "@/lib/products"
import { ShopClient } from "./shop-client"
import { MessageCircle } from "lucide-react"
import { Metadata } from "next"

export const revalidate = 60

export const metadata: Metadata = {
  title: "Loja — Peças Automotivas Raras",
  description: "Encontre peças automotivas raras e de difícil localização. Filtros por categoria, busca rápida e envio para todo o Brasil. Pague com PIX e ganhe 5% de desconto.",
  openGraph: {
    title: "Loja | Mosca Branca Parts — Peças Automotivas Raras",
    description: "Encontre peças automotivas raras. Categorias, busca e envio nacional.",
    type: "website",
    url: "https://www.moscabrancaparts.com.br/loja",
  },
}

interface PageProps {
  searchParams: { categoria?: string; busca?: string; pagina?: string }
}

const PRODUCTS_PER_PAGE = 24

export default async function LojaPage({ searchParams }: PageProps) {
  const categoria = searchParams.categoria || ""
  const busca = searchParams.busca || ""
  const page = Math.max(1, parseInt(searchParams.pagina || "1") || 1)

  // Fetch categories from Supabase
  const { data: catData } = await supabase
    .from("categories")
    .select("name, slug")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })

  const categories = [
    { label: "Todas", slug: "" },
    ...(catData || []).map((c: any) => ({ label: c.name, slug: c.slug })),
  ]

  let query = supabase
    .from("products")
    .select("*", { count: "exact" })
    .order("id", { ascending: false })

  if (categoria) {
    query = query.eq("category_slug", categoria)
  }
  if (busca) {
    query = query.ilike("name", `%${busca}%`)
  }

  const from = (page - 1) * PRODUCTS_PER_PAGE
  const to = from + PRODUCTS_PER_PAGE - 1
  query = query.range(from, to)

  const { data, error, count } = await query
  const totalProducts = count || 0
  const totalPages = Math.ceil(totalProducts / PRODUCTS_PER_PAGE)

  const products: Product[] = error
    ? []
    : (data || []).map((row: any) => ({
        id: row.id,
        slug: row.slug,
        name: row.name,
        price: row.price,
        oldPrice: row.old_price ?? undefined,
        category: row.category,
        categorySlug: row.category_slug,
        imageFile: row.image_file,
        description: row.description ?? "",
        weight: row.weight ?? undefined,
        dimensions: row.dimensions ?? undefined,
        inStock: row.in_stock,
        featured: row.featured,
      }))

  const activeLabel = categories.find((c) => c.slug === categoria)?.label || "Todas"

  function buildPageUrl(p: number, cat: string, search: string) {
    const params = new URLSearchParams()
    if (cat) params.set("categoria", cat)
    if (search) params.set("busca", search)
    if (p > 1) params.set("pagina", String(p))
    const qs = params.toString()
    return `/loja${qs ? `?${qs}` : ""}`
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <TopHeader />

      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav aria-label="Localização" className="mb-6 text-xs font-inter text-zinc-500">
          <a href="/" className="hover:text-red-600 transition-colors">Início</a>
          <span className="mx-2">›</span>
          <span className="text-zinc-800 font-medium">
            {categoria ? activeLabel : "Todos os Produtos"}
          </span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <ShopClient
            categories={categories}
            activeCategoria={categoria}
            activeBusca={busca}
          />

          {/* Products grid */}
          <main className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <h1 className="font-inter font-bold text-zinc-900 text-xl">
                {busca ? `Resultados para "${busca}"` : activeLabel === "Todas" ? "Todos os Produtos" : activeLabel}
              </h1>
              <span className="text-sm text-zinc-500 font-inter">
                {totalProducts} {totalProducts === 1 ? "produto" : "produtos"}
              </span>
            </div>

            {products.length === 0 ? (
              <div className="text-center py-16 bg-white border border-zinc-100 rounded-xl">
                <p className="text-zinc-500 font-inter text-lg mb-2">Nenhum produto encontrado</p>
                <p className="text-zinc-400 font-inter text-sm">
                  {busca
                    ? "Tente buscar com outros termos"
                    : "Esta categoria ainda não possui produtos cadastrados"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {products.map((p) => (
                  <a
                    key={p.id}
                    href={`/produto/${p.slug}`}
                    className="bg-white border border-zinc-100 rounded-xl flex flex-col group hover:shadow-md hover:border-zinc-200 transition-all duration-300 cursor-pointer overflow-hidden"
                  >
                    <div className="relative bg-zinc-50/80 aspect-square overflow-hidden">
                      <img
                        src={imgUrl(p.imageFile)}
                        alt={p.name}
                        className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500 ease-out"
                        loading="lazy"
                      />
                      <div className="absolute top-2 left-2 flex flex-col gap-1">
                        <span className="bg-red-50 text-red-700 font-inter font-semibold px-2 py-0.5 rounded-md text-[10px]">
                          RARO
                        </span>
                      </div>
                    </div>
                    <div className="p-3 flex flex-col flex-1">
                      <p className="font-inter text-[10px] text-zinc-400 uppercase tracking-wider mb-0.5">{p.category}</p>
                      <h3 className="font-inter text-xs text-zinc-800 font-medium line-clamp-2 mb-2 leading-tight">
                        {p.name}
                      </h3>
                      <div className="mt-auto">
                        {p.oldPrice && (
                          <p className="text-zinc-400 text-[11px] line-through font-inter">
                            R$ {fmt(p.oldPrice)}
                          </p>
                        )}
                        <p className="font-barlow font-black text-zinc-900 text-lg leading-tight">
                          R$ {fmt(pixPrice(p.price))}
                        </p>
                        <p className="text-green-700 text-[10px] font-inter font-semibold bg-green-50 inline-block px-1.5 py-0.5 rounded mt-0.5">
                          5% OFF no PIX
                        </p>
                        <p className="text-zinc-500 text-[10px] font-inter mt-1">
                          ou 3x de R$ {fmt(installmentPrice(p.price, 3))}
                        </p>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <nav aria-label="Paginação" className="mt-8 flex items-center justify-center gap-2">
                {page > 1 && (
                  <a
                    href={buildPageUrl(page - 1, categoria, busca)}
                    className="px-3 py-2 text-sm font-inter text-zinc-600 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors"
                  >
                    ← Anterior
                  </a>
                )}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                  .map((p, idx, arr) => (
                    <span key={p}>
                      {idx > 0 && arr[idx - 1] !== p - 1 && (
                        <span className="px-1 text-zinc-400">…</span>
                      )}
                      <a
                        href={buildPageUrl(p, categoria, busca)}
                        className={`px-3 py-2 text-sm font-inter rounded-lg transition-colors ${
                          p === page
                            ? "bg-red-600 text-white font-semibold"
                            : "text-zinc-600 border border-zinc-200 hover:bg-zinc-50"
                        }`}
                      >
                        {p}
                      </a>
                    </span>
                  ))}
                {page < totalPages && (
                  <a
                    href={buildPageUrl(page + 1, categoria, busca)}
                    className="px-3 py-2 text-sm font-inter text-zinc-600 border border-zinc-200 rounded-lg hover:bg-zinc-50 transition-colors"
                  >
                    Próxima →
                  </a>
                )}
              </nav>
            )}
          </main>
        </div>
      </div>

      {/* WhatsApp CTA */}
      <div className="container mx-auto px-4 py-8">
        <div className="p-5 bg-zinc-900 border border-zinc-800/50 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl">
          <div>
            <p className="font-inter font-semibold text-white text-sm">Não achou a peça que precisa?</p>
            <p className="font-inter text-zinc-400 text-xs mt-0.5">Fale com nossos especialistas pelo WhatsApp</p>
          </div>
          <a
            href="https://wa.me/5534999365936"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-inter font-semibold text-sm px-6 py-3 min-h-[44px] transition-colors duration-200 whitespace-nowrap rounded-lg cursor-pointer"
          >
            <MessageCircle className="h-5 w-5" aria-hidden="true" />
            Chamar no WhatsApp
          </a>
        </div>
      </div>

      <Footer />
    </div>
  )
}

"use client"

import { useRouter } from "next/navigation"
import { useState, Suspense } from "react"
import { Search, X } from "lucide-react"

interface Category {
  label: string
  slug: string
}

interface ShopClientProps {
  categories: Category[]
  activeCategoria: string
  activeBusca: string
}

function ShopFilters({ categories, activeCategoria, activeBusca }: ShopClientProps) {
  const router = useRouter()
  const [busca, setBusca] = useState(activeBusca)

  function navigate(categoria: string, search?: string) {
    const params = new URLSearchParams()
    if (categoria) params.set("categoria", categoria)
    const s = search ?? busca
    if (s) params.set("busca", s)
    const qs = params.toString()
    router.push(`/loja${qs ? `?${qs}` : ""}`)
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    navigate(activeCategoria, busca.trim())
  }

  function clearSearch() {
    setBusca("")
    navigate(activeCategoria, "")
  }

  return (
    <aside className="lg:w-56 flex-shrink-0">
      {/* Search within results */}
      <form onSubmit={handleSearch} className="mb-4">
        <div className="relative">
          <input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Filtrar produtos..."
            className="w-full bg-white border border-zinc-200 rounded-lg px-3 py-2.5 pr-16 text-sm font-inter text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-red-300 transition-colors"
          />
          <div className="absolute right-1 top-1 flex items-center gap-0.5">
            {busca && (
              <button
                type="button"
                onClick={clearSearch}
                className="p-1.5 text-zinc-400 hover:text-zinc-600 transition-colors"
                aria-label="Limpar busca"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <button
              type="submit"
              className="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
              aria-label="Buscar"
            >
              <Search className="h-4 w-4" />
            </button>
          </div>
        </div>
      </form>

      {/* Category list — desktop */}
      <nav aria-label="Categorias" className="hidden lg:block">
        <h2 className="font-inter font-bold text-zinc-900 text-sm mb-3 uppercase tracking-wide">Categorias</h2>
        <ul className="space-y-0.5">
          {categories.map((cat) => (
            <li key={cat.slug}>
              <button
                onClick={() => navigate(cat.slug, busca)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-inter transition-colors cursor-pointer ${
                  activeCategoria === cat.slug
                    ? "bg-red-50 text-red-700 font-medium"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                }`}
              >
                {cat.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Category list — mobile horizontal */}
      <div className="lg:hidden overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
        <div className="flex gap-2">
          {categories.map((cat) => (
            <button
              key={cat.slug}
              onClick={() => navigate(cat.slug, busca)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-inter transition-colors cursor-pointer ${
                activeCategoria === cat.slug
                  ? "bg-red-600 text-white font-medium"
                  : "bg-white border border-zinc-200 text-zinc-600 hover:border-zinc-400"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>
    </aside>
  )
}

export function ShopClient(props: ShopClientProps) {
  return (
    <Suspense fallback={<aside className="lg:w-56 flex-shrink-0" />}>
      <ShopFilters {...props} />
    </Suspense>
  )
}

"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Search, MapPin, ChevronDown, Menu, X, Phone, MessageCircle, Zap, User, LayoutGrid } from "lucide-react"
import Image from "next/image"
import { AuthStatus } from "@/components/auth/auth-status"
import { CartButton } from "@/components/cart/cart-button"
import { CartDrawer } from "@/components/cart/cart-drawer"
import { VehicleSearchButton } from "@/components/vehicle/vehicle-search-button"
import { VehicleSearchDropdown } from "@/components/vehicle/vehicle-search-dropdown"
import { CepModal } from "@/components/cep/cep-modal"
import type { Vehicle } from "@/lib/vehicle-types"

const TOP_LINKS = [
  { label: "Sobre", href: "/sobre" },
  { label: "Rastrear Pedido", href: "/minha-conta/pedidos" },
  { label: "Meus Pedidos", href: "/minha-conta/pedidos" },
]

const DEFAULT_CATEGORIES = [
  { label: "Saídas de Ar", slug: "saidas-de-ar" },
  { label: "Acessórios", slug: "acessorios" },
  { label: "Tampas e Acabamentos", slug: "tampas-e-acabamentos" },
  { label: "Banco e Assento", slug: "banco-e-assento" },
  { label: "Travas e Fechaduras", slug: "fechaduras" },
  { label: "Interruptores e Botões", slug: "interruptores-e-botoes" },
  { label: "Componentes de Motor", slug: "motor" },
]

export function TopHeader() {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [vehicleSearchOpen, setVehicleSearchOpen] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null)
  const [cepModalOpen, setCepModalOpen] = useState(false)
  const [savedCep, setSavedCep] = useState<{ cep: string; cidade: string; uf: string } | null>(null)
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES)
  const [deptOpen, setDeptOpen] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem("mosca-cep")
    if (stored) {
      try { setSavedCep(JSON.parse(stored)) } catch {}
    }
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => {
        if (data.categories?.length > 0) {
          setCategories(data.categories.map((c: any) => ({ label: c.name, slug: c.slug })))
        }
      })
      .catch(() => {})
  }, [])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/loja?busca=${encodeURIComponent(query.trim())}`)
      setMobileMenuOpen(false)
    }
  }

  return (
    <>
      <header className="sticky top-0 z-50 bg-zinc-950 shadow-lg shadow-black/20">

        {/* Utility bar — promos + links */}
        <div className="hidden lg:block bg-gradient-to-r from-red-700 via-red-600 to-red-700">
          <div className="container mx-auto px-4 flex items-center justify-between h-9">
            <div className="flex items-center gap-2">
              <Zap className="h-3.5 w-3.5 text-white" aria-hidden="true" />
              <span className="text-white text-xs font-semibold tracking-wide">
                5% OFF no PIX • Frete para todo o Brasil • Até 6x sem juros
              </span>
            </div>
            <div className="flex items-center gap-5">
              {TOP_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  {...(link.href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  className="text-white/80 text-xs hover:text-white transition-colors duration-150"
                >
                  {link.label}
                </a>
              ))}
              <a
                href="https://wa.me/5534999365936"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white text-xs font-semibold hover:text-white/90 transition-colors flex items-center gap-1"
              >
                <MessageCircle className="h-3 w-3" aria-hidden="true" />
                WhatsApp
              </a>
            </div>
          </div>
        </div>

        {/* Main header */}
        <div className="container mx-auto px-4 relative">
          <div className="flex items-center gap-4 h-[68px]">

            {/* Logo */}
            <a href="/" aria-label="Mosca Branca Parts — Página inicial" className="flex-shrink-0">
              <Image
                src="https://www.moscabrancaparts.com.br/wp-content/uploads/2025/02/moscabranca-768x412.png"
                alt="Mosca Branca Parts"
                width={140}
                height={75}
                className="h-11 w-auto object-contain"
                priority
              />
            </a>

            {/* Vehicle search — desktop */}
            <div className="relative hidden md:block" id="vehicle-search-container">
              <VehicleSearchButton
                onClick={() => setVehicleSearchOpen(!vehicleSearchOpen)}
                isActive={vehicleSearchOpen}
                selectedVehicle={selectedVehicle}
              />
              <VehicleSearchDropdown
                isOpen={vehicleSearchOpen}
                onClose={() => setVehicleSearchOpen(false)}
                initialVehicle={selectedVehicle}
              />
            </div>

            {/* Search bar */}
            <form onSubmit={handleSearch} className="flex flex-1 min-w-0 h-11 rounded-xl overflow-hidden ring-1 ring-zinc-700 focus-within:ring-2 focus-within:ring-red-500 transition-all duration-200">
              <label htmlFor="site-search" className="sr-only">Pesquisar peças e acessórios</label>
              <input
                id="site-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar peças, acessórios, componentes..."
                autoComplete="off"
                className="flex-1 bg-zinc-900 text-white text-sm px-4 placeholder:text-zinc-500 focus:outline-none border-0 min-w-0"
              />
              <button
                type="submit"
                aria-label="Pesquisar"
                className="bg-red-600 hover:bg-red-500 text-white px-5 flex items-center justify-center transition-colors duration-150 min-w-[52px] cursor-pointer"
              >
                <Search className="h-5 w-5" aria-hidden="true" />
              </button>
            </form>

            {/* Right icons — desktop */}
            <nav aria-label="Ações do usuário" className="hidden lg:flex items-center gap-1">
              <button onClick={() => setCepModalOpen(true)} className="flex items-center gap-2 text-zinc-300 hover:text-white px-3 py-2 min-h-[44px] transition-colors duration-150 cursor-pointer rounded-lg hover:bg-zinc-800/60">
                <MapPin className="h-5 w-5 text-red-400 flex-shrink-0" aria-hidden="true" />
                <div className="text-xs leading-tight text-left">
                  {savedCep ? (
                    <>
                      <p className="text-zinc-500">{savedCep.cep.replace(/(\d{5})(\d{3})/, "$1-$2")}</p>
                      <p className="font-semibold text-white">{savedCep.cidade}</p>
                    </>
                  ) : (
                    <>
                      <p className="text-zinc-500">Informe</p>
                      <p className="font-semibold text-white">seu CEP</p>
                    </>
                  )}
                </div>
              </button>
              <AuthStatus />
              <CartButton />
            </nav>

            {/* Mobile icons */}
            <div className="flex lg:hidden items-center gap-1">
              <CartButton />
              <button
                aria-label={mobileMenuOpen ? "Fechar menu" : "Abrir menu"}
                aria-expanded={mobileMenuOpen}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
              </button>
            </div>
          </div>
        </div>

        {/* Category nav */}
        <nav aria-label="Categorias" className="bg-zinc-900 border-t border-zinc-800/60">
          <div className="container mx-auto px-4">
            <div className="flex items-center h-11">
              {/* Departments dropdown */}
              <div className="relative flex-shrink-0">
                <button
                  onClick={() => setDeptOpen(!deptOpen)}
                  aria-label="Ver todos os departamentos"
                  aria-expanded={deptOpen}
                  className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium px-4 h-11 transition-colors duration-150 rounded-none cursor-pointer"
                >
                  <LayoutGrid className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden sm:inline">Departamentos</span>
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${deptOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
                </button>
                {deptOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setDeptOpen(false)} aria-hidden="true" />
                    <div className="absolute top-full left-0 z-40 w-60 bg-zinc-900 border border-zinc-700 shadow-2xl rounded-b-xl overflow-hidden">
                      {categories.map((cat) => (
                        <a
                          key={cat.slug}
                          href={`/loja?categoria=${cat.slug}`}
                          onClick={() => setDeptOpen(false)}
                          className="block px-5 py-3 text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors border-b border-zinc-800/50 last:border-0"
                        >
                          {cat.label}
                        </a>
                      ))}
                      <a
                        href="/loja"
                        onClick={() => setDeptOpen(false)}
                        className="block px-5 py-3 text-sm font-bold text-red-400 hover:text-red-300 hover:bg-zinc-800 border-t border-zinc-700 transition-colors"
                      >
                        Ver todos →
                      </a>
                    </div>
                  </>
                )}
              </div>

              {/* Scrollable category links */}
              <div className="flex-1 overflow-x-auto flex items-center h-11" style={{ scrollbarWidth: "none" }}>
                {categories.slice(0, 6).map((cat) => (
                  <a
                    key={cat.slug}
                    href={`/loja?categoria=${cat.slug}`}
                    className="text-zinc-400 hover:text-white text-sm px-4 h-full flex items-center flex-shrink-0 hover:bg-zinc-800/60 transition-colors duration-150 whitespace-nowrap relative after:absolute after:bottom-0 after:left-4 after:right-4 after:h-0.5 after:bg-red-500 after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-200"
                  >
                    {cat.label}
                  </a>
                ))}
              </div>

              <a
                href="/loja"
                className="ml-auto bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-5 h-8 flex items-center flex-shrink-0 transition-all duration-200 whitespace-nowrap rounded-full uppercase tracking-wide"
              >
                Ofertas
              </a>
            </div>
          </div>
        </nav>
      </header>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden" onClick={() => setMobileMenuOpen(false)} aria-hidden="true" />
          <nav
            aria-label="Menu mobile"
            className="fixed top-0 left-0 bottom-0 z-50 w-[280px] bg-zinc-950 border-r border-zinc-800 flex flex-col lg:hidden shadow-2xl"
          >
            <div className="flex items-center justify-between px-5 h-16 border-b border-zinc-800/80">
              <Image
                src="https://www.moscabrancaparts.com.br/wp-content/uploads/2025/02/moscabranca-768x412.png"
                alt="Mosca Branca Parts"
                width={120}
                height={64}
                className="h-8 w-auto object-contain"
              />
              <button onClick={() => setMobileMenuOpen(false)} aria-label="Fechar" className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors">
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            {/* Mobile search */}
            <div className="px-4 py-4 border-b border-zinc-800/50">
              <form onSubmit={handleSearch} className="flex h-10 rounded-lg overflow-hidden ring-1 ring-zinc-700">
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar peças..."
                  className="flex-1 bg-zinc-900 text-white text-sm px-3 placeholder:text-zinc-500 focus:outline-none"
                />
                <button type="submit" className="bg-red-600 px-3 text-white cursor-pointer">
                  <Search className="h-4 w-4" aria-hidden="true" />
                </button>
              </form>
            </div>

            <ul className="flex flex-col overflow-y-auto flex-1 py-2">
              {categories.map((cat) => (
                <li key={cat.slug}>
                  <a href={`/loja?categoria=${cat.slug}`} className="block px-5 py-3 text-sm text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors min-h-[44px] flex items-center" onClick={() => setMobileMenuOpen(false)}>
                    {cat.label}
                  </a>
                </li>
              ))}
              <li>
                <a href="/loja" className="block px-5 py-3 text-sm font-bold text-red-400 hover:bg-zinc-900 transition-colors min-h-[44px] flex items-center border-t border-zinc-800/50 mt-2" onClick={() => setMobileMenuOpen(false)}>
                  🔥 Ofertas
                </a>
              </li>
            </ul>

            <div className="px-4 py-4 border-t border-zinc-800 space-y-2 bg-zinc-900/50">
              <a href="tel:3499936-5936" className="flex items-center gap-3 text-zinc-300 hover:text-white py-2 min-h-[44px] transition-colors">
                <Phone className="h-5 w-5 text-red-400" aria-hidden="true" />
                <span className="text-sm">(34) 99936-5936</span>
              </a>
              <a href="https://wa.me/5534999365936" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 bg-green-600 hover:bg-green-500 text-white py-3 px-4 rounded-xl min-h-[44px] transition-colors">
                <MessageCircle className="h-5 w-5" aria-hidden="true" />
                <span className="text-sm font-semibold">Chamar no WhatsApp</span>
              </a>
            </div>
          </nav>
        </>
      )}

      <CartDrawer />
      <CepModal
        open={cepModalOpen}
        onClose={() => setCepModalOpen(false)}
        onSave={(data) => {
          setSavedCep(data)
          localStorage.setItem("mosca-cep", JSON.stringify(data))
        }}
      />
    </>
  )
}

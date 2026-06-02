"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Search, MapPin, ShoppingCart, ChevronDown, Car, Menu, X, Phone, MessageCircle } from "lucide-react"
import Image from "next/image"
import { AuthStatus } from "@/components/auth/auth-status"
import { CartButton } from "@/components/cart/cart-button"
import { CartDrawer } from "@/components/cart/cart-drawer"
import { VehicleSearchButton } from "@/components/vehicle/vehicle-search-button"
import { VehicleSearchDropdown } from "@/components/vehicle/vehicle-search-dropdown"
import { CepModal } from "@/components/cep/cep-modal"
import type { Vehicle } from "@/lib/vehicle-types"

const TOP_LINKS = ["Conheça a Mosca Branca", "Atendimento", "Rastrear Pedido", "Meus Pedidos"]

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
      <header className="sticky top-0 z-50 bg-zinc-950 shadow-sm">

        {/* Utility bar */}
        <div className="hidden lg:block bg-zinc-950/60 border-b border-zinc-800/50">
          <div className="container mx-auto px-4 flex items-center justify-end gap-6 h-8">
            {TOP_LINKS.map((link) => (
              <a key={link} href="#" className="text-zinc-400 text-xs hover:text-zinc-100 transition-colors duration-150">
                {link}
              </a>
            ))}
            <a href="tel:3499936-5936" className="text-zinc-400 text-xs hover:text-zinc-100 transition-colors flex items-center gap-1">
              <Phone className="h-3 w-3" aria-hidden="true" />
              (34) 99936-5936
            </a>
            <a
              href="https://wa.me/5534999365936"
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-500 text-xs hover:text-green-400 transition-colors flex items-center gap-1"
            >
              <MessageCircle className="h-3 w-3" aria-hidden="true" />
              WhatsApp
            </a>
          </div>
        </div>

        {/* Main header */}
        <div className="container mx-auto px-4 relative">
          <div className="flex items-center gap-3 h-16">

            {/* Logo */}
            <a href="/" aria-label="Mosca Branca Parts — Página inicial" className="flex-shrink-0">
              <Image
                src="https://www.moscabrancaparts.com.br/wp-content/uploads/2025/02/moscabranca-768x412.png"
                alt="Mosca Branca Parts"
                width={140}
                height={75}
                className="h-10 w-auto object-contain"
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
            <form onSubmit={handleSearch} className="flex flex-1 min-w-0 h-11">
              <label htmlFor="site-search" className="sr-only">Pesquisar peças e acessórios</label>
              <input
                id="site-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar peças, acessórios, componentes..."
                autoComplete="off"
                className="flex-1 bg-white text-zinc-900 text-sm px-4 placeholder:text-zinc-400 focus:outline-none border-0 min-w-0"
              />
              <button
                type="submit"
                aria-label="Pesquisar"
                className="bg-red-600 hover:bg-red-700 text-white px-5 flex items-center justify-center transition-colors duration-150 min-w-[52px] cursor-pointer"
              >
                <Search className="h-5 w-5" aria-hidden="true" />
              </button>
            </form>

            {/* Right icons — desktop */}
            <nav aria-label="Ações do usuário" className="hidden lg:flex items-center gap-1">
              <button onClick={() => setCepModalOpen(true)} className="flex items-center gap-2 text-zinc-300 hover:text-white px-3 py-2 min-h-[44px] transition-colors duration-150 cursor-pointer">
                <MapPin className="h-5 w-5 text-red-500 flex-shrink-0" aria-hidden="true" />
                <div className="text-xs leading-tight text-left">
                  {savedCep ? (
                    <>
                      <p className="text-zinc-500">{savedCep.cep.replace(/(\d{5})(\d{3})/, "$1-$2")}</p>
                      <p className="font-semibold">{savedCep.cidade}</p>
                    </>
                  ) : (
                    <>
                      <p className="text-zinc-500">Informe</p>
                      <p className="font-semibold">seu CEP</p>
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
                className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center text-zinc-300"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
              </button>
            </div>
          </div>
        </div>

        {/* Category nav */}
        <nav aria-label="Categorias" className="bg-zinc-900/80 border-t border-zinc-800/50 backdrop-blur-sm">
          <div className="container mx-auto px-4">
            <div className="flex items-center h-11 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
              <button
                aria-label="Ver todos os departamentos"
                className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium px-4 h-full flex-shrink-0 transition-colors duration-150 border-r border-zinc-700"
              >
                <Menu className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">Compre por departamento</span>
                <span className="sm:hidden">Departamentos</span>
              </button>
              {categories.map((cat) => (
                <a
                  key={cat.slug}
                  href={`/loja?categoria=${cat.slug}`}
                  className="text-zinc-400 hover:text-white text-sm px-5 h-full flex items-center flex-shrink-0 hover:bg-zinc-800 transition-colors duration-150 whitespace-nowrap"
                >
                  {cat.label}
                </a>
              ))}
              <a
                href="/loja"
                className="ml-auto bg-red-600/90 hover:bg-red-600 text-white text-sm font-semibold px-6 h-full flex items-center flex-shrink-0 transition-colors duration-200 whitespace-nowrap"
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
          <div className="fixed inset-0 z-40 bg-zinc-950/70 lg:hidden" onClick={() => setMobileMenuOpen(false)} aria-hidden="true" />
          <nav
            aria-label="Menu mobile"
            className="fixed top-0 left-0 bottom-0 z-50 w-72 bg-zinc-950 border-r border-zinc-800/50 flex flex-col lg:hidden"
          >
            <div className="flex items-center justify-between px-4 h-16 border-b border-zinc-800">
              <Image
                src="https://www.moscabrancaparts.com.br/wp-content/uploads/2025/02/moscabranca-768x412.png"
                alt="Mosca Branca Parts"
                width={120}
                height={64}
                className="h-8 w-auto object-contain"
              />
              <button onClick={() => setMobileMenuOpen(false)} aria-label="Fechar" className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-zinc-400 hover:text-white">
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
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
                <a href="/loja" className="block px-5 py-3 text-sm font-bold text-red-500 hover:bg-zinc-900 transition-colors min-h-[44px] flex items-center" onClick={() => setMobileMenuOpen(false)}>
                  Ofertas
                </a>
              </li>
            </ul>
            <div className="px-4 py-4 border-t border-zinc-800 space-y-2">
              <a href="tel:3499936-5936" className="flex items-center gap-3 text-zinc-300 hover:text-white py-2 min-h-[44px]">
                <Phone className="h-5 w-5 text-red-500" aria-hidden="true" />
                <span className="text-sm">(34) 99936-5936</span>
              </a>
              <a href="https://wa.me/5534999365936" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-green-500 hover:text-green-400 py-2 min-h-[44px]">
                <MessageCircle className="h-5 w-5" aria-hidden="true" />
                <span className="text-sm">WhatsApp</span>
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

"use client"

import { useState } from "react"
import { Search, MapPin, ShoppingCart, ChevronDown, Car, Menu, X, Phone, MessageCircle } from "lucide-react"
import Image from "next/image"
import { AuthStatus } from "@/components/auth/auth-status"
import { CartButton } from "@/components/cart/cart-button"
import { CartDrawer } from "@/components/cart/cart-drawer"

const TOP_LINKS = ["Conheça a Mosca Branca", "Atendimento", "Rastrear Pedido", "Meus Pedidos"]

const CATEGORIES = [
  "Saídas de Ar",
  "Acessórios",
  "Tampas e Acabamentos",
  "Banco e Assento",
  "Travas e Fechaduras",
  "Interruptores e Botões",
  "Componentes de Motor",
]

export function TopHeader() {
  const [query, setQuery] = useState("")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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
              href="https://wa.me/5518997696952"
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
        <div className="container mx-auto px-4">
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
            <button
              aria-label="Buscar por veículo"
              className="hidden md:flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-sm px-4 min-h-[44px] border border-zinc-700 transition-colors duration-150 whitespace-nowrap flex-shrink-0"
            >
              <Car className="h-4 w-4 text-red-500" aria-hidden="true" />
              <span className="text-sm">Buscar com veículo</span>
              <ChevronDown className="h-3.5 w-3.5 text-zinc-400" aria-hidden="true" />
            </button>

            {/* Search bar */}
            <div className="flex flex-1 min-w-0 h-11">
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
                className="bg-red-600 hover:bg-red-700 text-white px-5 flex items-center justify-center transition-colors duration-150 min-w-[52px]"
              >
                <Search className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            {/* Right icons — desktop */}
            <nav aria-label="Ações do usuário" className="hidden lg:flex items-center gap-1">
              <a href="#" className="flex items-center gap-2 text-zinc-300 hover:text-white px-3 py-2 min-h-[44px] transition-colors duration-150">
                <MapPin className="h-5 w-5 text-red-500 flex-shrink-0" aria-hidden="true" />
                <div className="text-xs leading-tight">
                  <p className="text-zinc-500">Informe</p>
                  <p className="font-semibold">seu CEP</p>
                </div>
              </a>
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
              {CATEGORIES.map((cat) => (
                <a
                  key={cat}
                  href="#"
                  className="text-zinc-400 hover:text-white text-sm px-5 h-full flex items-center flex-shrink-0 hover:bg-zinc-800 transition-colors duration-150 whitespace-nowrap"
                >
                  {cat}
                </a>
              ))}
              <a
                href="#"
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
              {CATEGORIES.map((cat) => (
                <li key={cat}>
                  <a href="#" className="block px-5 py-3 text-sm text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors min-h-[44px] flex items-center" onClick={() => setMobileMenuOpen(false)}>
                    {cat}
                  </a>
                </li>
              ))}
              <li>
                <a href="#" className="block px-5 py-3 text-sm font-bold text-red-500 hover:bg-zinc-900 transition-colors min-h-[44px] flex items-center" onClick={() => setMobileMenuOpen(false)}>
                  Ofertas
                </a>
              </li>
            </ul>
            <div className="px-4 py-4 border-t border-zinc-800 space-y-2">
              <a href="tel:3499936-5936" className="flex items-center gap-3 text-zinc-300 hover:text-white py-2 min-h-[44px]">
                <Phone className="h-5 w-5 text-red-500" aria-hidden="true" />
                <span className="text-sm">(34) 99936-5936</span>
              </a>
              <a href="https://wa.me/5518997696952" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-green-500 hover:text-green-400 py-2 min-h-[44px]">
                <MessageCircle className="h-5 w-5" aria-hidden="true" />
                <span className="text-sm">WhatsApp</span>
              </a>
            </div>
          </nav>
        </>
      )}

      <CartDrawer />
    </>
  )
}

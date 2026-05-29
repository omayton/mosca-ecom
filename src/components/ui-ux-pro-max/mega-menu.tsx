"use client"

import { useState, useEffect } from "react"
import { Search, ShoppingBag, Heart, Menu, X, ChevronDown } from "lucide-react"

const NAV_LINKS = [
  {
    label: "Novidades",
    href: "#",
    sub: ["Lançamentos", "Mais Vendidos", "Edição Limitada"],
  },
  {
    label: "Feminino",
    href: "#",
    sub: ["Vestidos", "Blusas", "Calças", "Jaquetas"],
  },
  {
    label: "Masculino",
    href: "#",
    sub: ["Camisetas", "Calças", "Jaquetas", "Acessórios"],
  },
  { label: "Sale", href: "#", sub: [] },
]

export function MegaMenu() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeNav, setActiveNav] = useState<string | null>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? "glass shadow-sm" : "bg-transparent"
        }`}
      >
        {/* Announcement bar */}
        <div className="bg-stone-900 text-stone-100 text-xs font-jost tracking-widest text-center py-2 px-4 uppercase">
          Frete grátis para compras acima de R$&nbsp;299 &nbsp;·&nbsp; Troca fácil em 30 dias
        </div>

        <div className="container mx-auto px-4">
          <nav className="flex items-center justify-between h-16" role="navigation" aria-label="Menu principal">
            {/* Logo */}
            <a
              href="/"
              className="font-bodoni text-2xl font-semibold tracking-tight text-stone-900 hover:text-gold transition-colors duration-200"
              aria-label="Mosca — Página inicial"
            >
              MOSCA
            </a>

            {/* Desktop nav */}
            <ul className="hidden md:flex items-center gap-8" role="menubar">
              {NAV_LINKS.map((link) => (
                <li key={link.label} className="relative group" role="none">
                  <button
                    role="menuitem"
                    aria-haspopup={link.sub.length > 0}
                    aria-expanded={activeNav === link.label}
                    onMouseEnter={() => link.sub.length > 0 && setActiveNav(link.label)}
                    onMouseLeave={() => setActiveNav(null)}
                    onClick={() => setActiveNav(activeNav === link.label ? null : link.label)}
                    className={`flex items-center gap-1 text-sm font-jost font-medium tracking-wider uppercase transition-colors duration-200 py-2 min-h-[44px] ${
                      link.label === "Sale"
                        ? "text-gold hover:text-gold/80"
                        : "text-stone-700 hover:text-stone-950"
                    }`}
                  >
                    {link.label}
                    {link.sub.length > 0 && (
                      <ChevronDown className="h-3.5 w-3.5 transition-transform duration-200 group-hover:rotate-180" aria-hidden="true" />
                    )}
                  </button>

                  {/* Dropdown */}
                  {link.sub.length > 0 && (
                    <div
                      role="menu"
                      onMouseEnter={() => setActiveNav(link.label)}
                      onMouseLeave={() => setActiveNav(null)}
                      className={`absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-stone-50 border border-stone-200 shadow-lg rounded-sm min-w-[160px] py-2 transition-all duration-200 ${
                        activeNav === link.label
                          ? "opacity-100 translate-y-0 pointer-events-auto"
                          : "opacity-0 -translate-y-2 pointer-events-none"
                      }`}
                    >
                      {link.sub.map((item) => (
                        <a
                          key={item}
                          href="#"
                          role="menuitem"
                          className="block px-5 py-2.5 text-sm font-jost text-stone-600 hover:text-stone-950 hover:bg-stone-100 transition-colors duration-150 min-h-[44px] flex items-center"
                        >
                          {item}
                        </a>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>

            {/* Actions */}
            <div className="flex items-center gap-1">
              <button
                aria-label="Buscar"
                className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center text-stone-600 hover:text-stone-950 transition-colors duration-200 rounded-sm hover:bg-stone-100"
              >
                <Search className="h-5 w-5" aria-hidden="true" />
              </button>
              <button
                aria-label="Lista de desejos"
                className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center text-stone-600 hover:text-stone-950 transition-colors duration-200 rounded-sm hover:bg-stone-100 hidden sm:flex"
              >
                <Heart className="h-5 w-5" aria-hidden="true" />
              </button>
              <button
                aria-label="Carrinho de compras (0 itens)"
                className="p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center text-stone-600 hover:text-stone-950 transition-colors duration-200 rounded-sm hover:bg-stone-100 relative"
              >
                <ShoppingBag className="h-5 w-5" aria-hidden="true" />
                <span
                  aria-hidden="true"
                  className="absolute top-1.5 right-1.5 bg-gold text-white text-[10px] font-semibold rounded-full w-4 h-4 flex items-center justify-center leading-none"
                >
                  0
                </span>
              </button>

              {/* Mobile hamburger */}
              <button
                aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen(!menuOpen)}
                className="md:hidden p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center text-stone-600 hover:text-stone-950 transition-colors duration-200 ml-1"
              >
                {menuOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* Mobile drawer */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        >
          <div className="absolute inset-0 bg-stone-950/40" />
        </div>
      )}
      <nav
        aria-label="Menu mobile"
        className={`fixed top-0 right-0 bottom-0 z-40 w-72 bg-stone-50 shadow-2xl transform transition-transform duration-300 ease-out md:hidden flex flex-col ${
          menuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-6 h-16 border-b border-stone-200">
          <span className="font-bodoni text-xl font-semibold">MOSCA</span>
          <button
            aria-label="Fechar menu"
            onClick={() => setMenuOpen(false)}
            className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-stone-600 hover:text-stone-950 transition-colors"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <ul className="flex flex-col py-4 overflow-y-auto flex-1">
          {NAV_LINKS.map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                className={`block px-6 py-3.5 text-sm font-jost font-medium tracking-wider uppercase transition-colors duration-150 min-h-[44px] flex items-center ${
                  link.label === "Sale"
                    ? "text-gold"
                    : "text-stone-700 hover:text-stone-950 hover:bg-stone-100"
                }`}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </a>
              {link.sub.map((item) => (
                <a
                  key={item}
                  href="#"
                  className="block pl-10 pr-6 py-2.5 text-sm font-jost text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-colors duration-150 min-h-[44px] flex items-center"
                  onClick={() => setMenuOpen(false)}
                >
                  {item}
                </a>
              ))}
            </li>
          ))}
        </ul>
        <div className="px-6 py-6 border-t border-stone-200">
          <a
            href="#"
            className="block w-full text-center bg-stone-900 text-stone-50 font-jost text-sm font-medium tracking-widest uppercase py-3.5 hover:bg-gold transition-colors duration-200 min-h-[44px]"
          >
            Entrar
          </a>
        </div>
      </nav>
    </>
  )
}

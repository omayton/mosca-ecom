import { TopHeader }    from "@/components/automotive/top-header"
import { HeroCarousel } from "@/components/automotive/hero-carousel"
import { PromoBanners } from "@/components/automotive/promo-banners"
import { ProductSection } from "@/components/automotive/product-section"
import { getFeaturedProducts, getRecentProducts } from "@/lib/products-db"
import { MessageCircle, Instagram, Facebook, Youtube, Truck, CreditCard, Shield, Package, Percent } from "lucide-react"
import Image from "next/image"

const TRUST = [
  { icon: Package,     text: "PEÇAS RARAS",          sub: "itens difíceis de encontrar" },
  { icon: Percent,     text: "5% OFF NO PIX",         sub: "em todo o site" },
  { icon: CreditCard,  text: "6X SEM JUROS",          sub: "parcele sem acréscimo" },
  { icon: Shield,      text: "30 DIAS DE GARANTIA",   sub: "devolução sem burocracia" },
  { icon: Truck,       text: "ENVIO NACIONAL",         sub: "Correios e transportadora" },
]

export const revalidate = 60

export default async function Home() {
  const [featured, recent] = await Promise.all([
    getFeaturedProducts(),
    getRecentProducts(),
  ])

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <TopHeader />
      <HeroCarousel />

      {/* Trust bar */}
      <div className="bg-zinc-950 border-t border-zinc-800/50">
        <div className="container mx-auto px-4 py-5">
          <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-y lg:divide-y-0 lg:divide-x divide-zinc-800/50">
            {TRUST.map(({ icon: Icon, text, sub }) => (
              <li key={text} className="flex items-center gap-3 py-4 px-4">
                <Icon className="h-5 w-5 text-red-500 flex-shrink-0" aria-hidden="true" />
                <div>
                  <p className="font-inter font-semibold text-white text-xs uppercase tracking-wide leading-tight">{text}</p>
                  <p className="font-inter text-zinc-500 text-[11px] leading-tight mt-0.5">{sub}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <PromoBanners />
      <ProductSection featured={featured} recent={recent} />

      {/* Footer */}
      <footer className="bg-zinc-950 border-t border-zinc-800/50 mt-4" role="contentinfo">
        <div className="container mx-auto px-4 py-14">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">

            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <Image
                src="https://www.moscabrancaparts.com.br/wp-content/uploads/2025/02/moscabranca-768x412.png"
                alt="Mosca Branca Parts"
                width={160}
                height={86}
                className="h-12 w-auto object-contain mb-4"
              />
              <p className="text-zinc-400 font-inter text-sm leading-relaxed mb-4">
                Peças raras, soluções únicas.<br />
                Aqui você encontra o que parecia impossível.
              </p>
              <p className="text-zinc-600 font-inter text-xs mb-4">
                Produção em Minas Gerais e São Paulo
              </p>
              {/* Social */}
              <div className="flex items-center gap-3">
                {[
                  { icon: Instagram, label: "Instagram", href: "#" },
                  { icon: Facebook,  label: "Facebook",  href: "#" },
                  { icon: Youtube,   label: "YouTube",   href: "#" },
                ].map(({ icon: Icon, label, href }) => (
                  <a
                    key={label}
                    href={href}
                    aria-label={label}
                    className="w-9 h-9 min-w-[44px] min-h-[44px] flex items-center justify-center bg-zinc-800/80 hover:bg-red-600 text-zinc-400 hover:text-white transition-all duration-200 rounded-full"
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </a>
                ))}
              </div>
            </div>

            {/* Links */}
            {[
              {
                title: "Categorias",
                links: ["Saídas de Ar", "Acessórios", "Tampas e Acabamentos", "Banco e Assento", "Travas e Fechaduras", "Interruptores e Botões", "Componentes de Motor"],
              },
              {
                title: "Atendimento",
                links: ["Central de Ajuda", "Rastrear Pedido", "Trocas e Devoluções", "Suporte Técnico"],
              },
              {
                title: "Contato",
                links: ["(34) 99936-5936", "WhatsApp disponível", "Envio nacional", "Segunda a Sábado"],
              },
            ].map(({ title, links }) => (
              <nav key={title} aria-label={title}>
                <h3 className="font-inter font-bold text-zinc-300 text-xs tracking-widest uppercase mb-4">{title}</h3>
                <ul className="space-y-2">
                  {links.map((link) => (
                    <li key={link}>
                      <a href="#" className="font-inter text-sm text-zinc-500 hover:text-zinc-200 transition-colors duration-150 min-h-[44px] flex items-center">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>

          {/* WhatsApp CTA */}
          <div className="mb-8 p-5 bg-zinc-900/80 border border-zinc-800/50 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl">
            <div>
              <p className="font-inter font-semibold text-white text-sm">Não achou a peça que precisa?</p>
              <p className="font-inter text-zinc-400 text-xs mt-0.5">Fale com nossos especialistas pelo WhatsApp</p>
            </div>
            <a
              href="https://wa.me/5534999365936"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-inter font-semibold text-sm px-6 py-3 min-h-[44px] transition-colors duration-200 whitespace-nowrap"
            >
              <MessageCircle className="h-5 w-5" aria-hidden="true" />
              Chamar no WhatsApp
            </a>
          </div>

          <div className="border-t border-zinc-800/50 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
            <p className="font-inter text-xs text-zinc-600">© 2025 Mosca Branca Parts. Todos os direitos reservados.</p>
            <p className="font-inter text-xs text-zinc-600">Pix · Cartão · Boleto · Parcelamento em até 6x sem juros</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

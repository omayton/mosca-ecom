import { TopHeader }    from "@/components/automotive/top-header"
import { HeroCarousel } from "@/components/automotive/hero-carousel"
import { ProductSection } from "@/components/automotive/product-section"
import { FlashSaleBanner } from "@/components/automotive/flash-sale-banner"
import { getFeaturedProducts, getRecentProducts, getDiscountProducts, getBestSellers } from "@/lib/products-db"
import { MessageCircle, Instagram, Facebook, Youtube, Truck, CreditCard, Shield, Package, Percent, Star, Wind, Wrench, LayoutGrid, Armchair, Lock, ToggleLeft } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import Image from "next/image"

const TRUST = [
  { icon: Package,     text: "PEÇAS RARAS",          sub: "itens difíceis de encontrar" },
  { icon: Percent,     text: "5% OFF NO PIX",         sub: "em todo o site" },
  { icon: CreditCard,  text: "6X SEM JUROS",          sub: "parcele sem acréscimo" },
  { icon: Shield,      text: "30 DIAS DE GARANTIA",   sub: "devolução sem burocracia" },
  { icon: Truck,       text: "ENVIO NACIONAL",         sub: "Correios e transportadora" },
]

const CATEGORIES_GRID: { label: string; slug: string; icon: LucideIcon }[] = [
  { label: "Saídas de Ar", slug: "saidas-de-ar", icon: Wind },
  { label: "Acessórios", slug: "acessorios", icon: Wrench },
  { label: "Tampas e Acabamentos", slug: "tampas-e-acabamentos", icon: LayoutGrid },
  { label: "Banco e Assento", slug: "banco-e-assento", icon: Armchair },
  { label: "Travas e Fechaduras", slug: "fechaduras", icon: Lock },
  { label: "Interruptores e Botões", slug: "interruptores-e-botoes", icon: ToggleLeft },
]

export const revalidate = 60

export const metadata = {
  title: "Mosca Branca Parts — Peças Automotivas Raras e de Difícil Localização",
  description:
    "Especialistas em peças automotivas raras e de difícil localização. Saídas de ar, tampas, acabamentos, interruptores e componentes. Envio para todo Brasil, garantia de 30 dias e 5% OFF no PIX.",
  alternates: { canonical: "https://www.moscabrancaparts.com.br" },
  openGraph: {
    type: "website",
    url: "https://www.moscabrancaparts.com.br",
    title: "Mosca Branca Parts — Peças Automotivas Raras",
    description:
      "Peças raras e de difícil localização. Envio para todo Brasil, garantia e 5% OFF no PIX.",
  },
}

export default async function Home() {
  const [featured, recent, discount, bestSellers] = await Promise.all([
    getFeaturedProducts(),
    getRecentProducts(8),
    getDiscountProducts(8),
    getBestSellers(8),
  ])

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Schema.org Organization + WebSite */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "Organization",
                name: "Mosca Branca Parts",
                url: "https://www.moscabrancaparts.com.br",
                logo: 'https://www.moscabrancaparts.com.br/images/05/bannermosca.png',
                contactPoint: {
                  "@type": "ContactPoint",
                  telephone: "+55-34-99936-5936",
                  contactType: "sales",
                  areaServed: "BR",
                  availableLanguage: "Portuguese",
                },
                sameAs: [],
              },
              {
                "@type": "WebSite",
                name: "Mosca Branca Parts",
                url: "https://www.moscabrancaparts.com.br",
                potentialAction: {
                  "@type": "SearchAction",
                  target: {
                    "@type": "EntryPoint",
                    urlTemplate: "https://www.moscabrancaparts.com.br/loja?busca={search_term_string}",
                  },
                  "query-input": "required name=search_term_string",
                },
              },
            ],
          }),
        }}
      />

      <TopHeader />
      <HeroCarousel />

      {/* Trust bar */}
      <div className="bg-white border-y border-zinc-100 shadow-sm">
        <div className="container mx-auto px-4 py-5">
          <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {TRUST.map(({ icon: Icon, text, sub }) => (
              <li key={text} className="flex items-center gap-3 px-3 py-2">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-red-600" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-bold text-zinc-900 text-xs uppercase tracking-wide leading-tight">{text}</p>
                  <p className="text-zinc-500 text-[11px] leading-tight mt-0.5">{sub}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Flash sale (countdown) — só renderiza se houver campanha ativa */}
      <FlashSaleBanner />

      {/* Categories Grid */}
      <section aria-label="Categorias" className="bg-[#FAFAFA] py-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="font-bold text-zinc-900 text-xl">Navegue por Categoria</h2>
            <p className="text-zinc-500 text-sm mt-1">Encontre a peça certa para o seu veículo</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {CATEGORIES_GRID.map((cat) => (
              <a
                key={cat.slug}
                href={`/loja?categoria=${cat.slug}`}
                className="bg-white border border-zinc-100 rounded-2xl p-5 flex flex-col items-center text-center group hover:shadow-lg hover:border-red-100 hover:bg-red-50/30 transition-all duration-300 cursor-pointer"
              >
                <cat.icon className="h-6 w-6 text-zinc-400 group-hover:text-red-600 transition-colors duration-300" aria-hidden="true" />
                <span className="text-xs font-semibold text-zinc-700 group-hover:text-red-700 transition-colors leading-tight">
                  {cat.label}
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <ProductSection featured={featured} recent={recent} discount={discount} bestSellers={bestSellers} />

      {/* Social proof / testimonial */}
      <section aria-label="Depoimentos" className="bg-white border-t border-zinc-100 py-14">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="font-bold text-zinc-900 text-xl">O que nossos clientes dizem</h2>
            <p className="text-zinc-500 text-sm mt-1">Avaliações reais de quem comprou</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { name: "Carlos M.", city: "São Paulo, SP", text: "Encontrei uma peça que procurava há meses. Entrega rápida e produto original." },
              { name: "Patrícia S.", city: "Belo Horizonte, MG", text: "Atendimento excelente pelo WhatsApp. Me ajudaram a identificar a peça correta pro meu carro." },
              { name: "Roberto L.", city: "Curitiba, PR", text: "Preço justo e frete calculado na hora. Já é minha segunda compra aqui." },
            ].map((review) => (
              <div key={review.name} className="bg-zinc-50/80 border border-zinc-100 rounded-2xl p-6">
                <div className="flex items-center gap-1 mb-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden="true" />
                  ))}
                </div>
                <p className="text-zinc-700 text-sm leading-relaxed mb-4">&ldquo;{review.text}&rdquo;</p>
                <div>
                  <p className="font-semibold text-zinc-900 text-sm">{review.name}</p>
                  <p className="text-zinc-500 text-xs">{review.city}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-zinc-950 border-t border-zinc-800/50 mt-4" role="contentinfo">
        <div className="container mx-auto px-4 py-14">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">

            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <Image
                src="/images/05/bannermosca-600x180.png" unoptimized
                alt="Mosca Branca Parts"
                width={160}
                height={86}
                className="h-12 w-auto object-contain mb-4"
              />
              <p className="text-zinc-400 text-sm leading-relaxed mb-4">
                Peças raras, soluções únicas.<br />
                Aqui você encontra o que parecia impossível.
              </p>
              <p className="text-zinc-600 text-xs mb-4">
                Produção em Minas Gerais e São Paulo
              </p>
              {/* Social */}
              <div className="flex items-center gap-3">
                {[
                  { icon: Instagram, label: "Instagram", href: "https://www.instagram.com/moscabrancaparts/" },
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
                links: [
                  { label: "Saídas de Ar", href: "/loja?categoria=saidas-de-ar" },
                  { label: "Acessórios", href: "/loja?categoria=acessorios" },
                  { label: "Tampas e Acabamentos", href: "/loja?categoria=tampas-e-acabamentos" },
                  { label: "Banco e Assento", href: "/loja?categoria=banco-e-assento" },
                  { label: "Travas e Fechaduras", href: "/loja?categoria=fechaduras" },
                  { label: "Interruptores e Botões", href: "/loja?categoria=interruptores-e-botoes" },
                  { label: "Ver todas", href: "/loja" },
                ],
              },
              {
                title: "Institucional",
                links: [
                  { label: "Sobre a Mosca Branca", href: "/sobre" },
                  { label: "Política de Privacidade", href: "/politica-de-privacidade" },
                  { label: "Termos de Uso", href: "/termos-de-uso" },
                  { label: "Meus Pedidos", href: "/minha-conta/pedidos" },
                ],
              },
              {
                title: "Contato",
                links: [
                  { label: "(34) 99936-5936", href: "tel:3499936-5936" },
                  { label: "WhatsApp", href: "https://wa.me/5534999365936" },
                  { label: "Envio nacional", href: "/loja" },
                  { label: "Segunda a Sábado", href: "#" },
                ],
              },
            ].map(({ title, links }) => (
              <nav key={title} aria-label={title}>
                <h3 className="font-bold text-zinc-300 text-xs tracking-widest uppercase mb-4">{title}</h3>
                <ul className="space-y-2">
                  {links.map((link) => (
                    <li key={link.label}>
                      <a href={link.href} className="text-sm text-zinc-500 hover:text-zinc-200 transition-colors duration-150 min-h-[44px] flex items-center">
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>

          {/* WhatsApp CTA */}
          <div className="mb-8 p-6 bg-gradient-to-r from-green-900/30 to-zinc-900/80 border border-green-800/30 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl">
            <div>
              <p className="font-bold text-white text-base">Não achou a peça que precisa?</p>
              <p className="text-zinc-400 text-sm mt-0.5">Nossos especialistas encontram para você</p>
            </div>
            <a
              href="https://wa.me/5534999365936"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-bold text-sm px-7 py-3.5 min-h-[44px] transition-all duration-200 whitespace-nowrap rounded-xl shadow-lg shadow-green-900/30 hover:shadow-green-800/40"
            >
              <MessageCircle className="h-5 w-5" aria-hidden="true" />
              Chamar no WhatsApp
            </a>
          </div>

          <div className="border-t border-zinc-800/50 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
            <p className="text-xs text-zinc-600">© 2025–2026 Mosca Branca Parts. Todos os direitos reservados.</p>
            <p className="text-xs text-zinc-600">Pix · Cartão · Boleto · Parcelamento em até 6x sem juros</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

import { TopHeader } from "@/components/automotive/top-header"
import { Footer } from "@/components/footer"
import { MessageCircle, Truck, Shield, Search } from "lucide-react"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Sobre a Mosca Branca Parts | Pecas Automotivas Raras",
  description: "Conheca a Mosca Branca Parts: especialistas em pecas automotivas raras e de dificil localizacao. Envio para todo o Brasil com garantia de qualidade.",
}

export default function SobrePage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col">
      <TopHeader />

      <main className="container mx-auto px-4 py-12 flex-1">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-bold text-zinc-900 text-3xl md:text-4xl mb-6">
            Sobre a Mosca Branca Parts
          </h1>

          <div className="prose prose-zinc max-w-none">
            <p className="text-zinc-600 text-lg leading-relaxed mb-6">
              A <strong>Mosca Branca Parts</strong> nasceu da paixao por carros e da dificuldade em encontrar pecas automotivas raras no mercado brasileiro. Somos especialistas em localizar e fornecer componentes que parecem impossiveis de achar.
            </p>

            <p className="text-zinc-600 leading-relaxed mb-6">
              Nosso foco sao pecas originais, de reposicao e restauracao para veiculos nacionais e importados. Trabalhamos com um amplo catalogo de itens como saidas de ar, tampas, acabamentos, interruptores, componentes de motor e muito mais.
            </p>

            <p className="text-zinc-600 leading-relaxed mb-8">
              Atendemos todo o Brasil com envio rapido e seguro atraves das melhores transportadoras. Cada peca e cuidadosamente verificada antes do envio para garantir a satisfacao dos nossos clientes.
            </p>
          </div>

          {/* Diferenciais */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
            <div className="bg-white border border-zinc-100 rounded-xl p-5">
              <Search className="h-6 w-6 text-red-600 mb-3" />
              <h3 className="font-semibold text-zinc-900 text-sm mb-1">Pecas Raras</h3>
              <p className="text-zinc-500 text-sm">Encontramos o que outros nao conseguem. Catalogo exclusivo de pecas dificeis.</p>
            </div>
            <div className="bg-white border border-zinc-100 rounded-xl p-5">
              <Truck className="h-6 w-6 text-red-600 mb-3" />
              <h3 className="font-semibold text-zinc-900 text-sm mb-1">Envio Nacional</h3>
              <p className="text-zinc-500 text-sm">Entregamos em todo o Brasil com rastreamento completo.</p>
            </div>
            <div className="bg-white border border-zinc-100 rounded-xl p-5">
              <Shield className="h-6 w-6 text-red-600 mb-3" />
              <h3 className="font-semibold text-zinc-900 text-sm mb-1">Garantia</h3>
              <p className="text-zinc-500 text-sm">30 dias de garantia em todas as pecas. Troca sem burocracia.</p>
            </div>
          </div>

          {/* CTA */}
          <div className="bg-zinc-900 rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-white text-base">Precisa de uma peca especifica?</p>
              <p className="text-zinc-400 text-sm mt-0.5">Fale conosco pelo WhatsApp e encontramos pra voce.</p>
            </div>
            <a
              href="https://wa.me/5534999365936"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold text-sm px-6 py-3 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              <MessageCircle className="h-5 w-5" />
              Falar no WhatsApp
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

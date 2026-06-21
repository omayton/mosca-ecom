import { MessageCircle, Phone, Mail, MapPin } from "lucide-react"
import Link from "next/link"

export function Footer() {
  return (
    <footer className="bg-zinc-950 border-t border-zinc-800/50 mt-auto" role="contentinfo">
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <h3 className="font-bold text-white text-lg mb-3">Mosca Branca Parts</h3>
            <p className="text-zinc-500 text-sm leading-relaxed">
              Especialistas em pecas automotivas raras e de dificil localizacao. Enviamos para todo o Brasil.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-white text-sm mb-3">Institucional</h4>
            <ul className="space-y-2">
              <li><Link href="/sobre" className="text-zinc-500 text-sm hover:text-white transition-colors">Sobre nos</Link></li>
              <li><Link href="/blog" className="text-zinc-500 text-sm hover:text-white transition-colors">Blog</Link></li>
              <li><Link href="/politica-de-privacidade" className="text-zinc-500 text-sm hover:text-white transition-colors">Politica de Privacidade</Link></li>
              <li><Link href="/termos-de-uso" className="text-zinc-500 text-sm hover:text-white transition-colors">Termos de Uso</Link></li>
            </ul>
          </div>

          {/* Conta */}
          <div>
            <h4 className="font-semibold text-white text-sm mb-3">Minha Conta</h4>
            <ul className="space-y-2">
              <li><Link href="/minha-conta" className="text-zinc-500 text-sm hover:text-white transition-colors">Meu Perfil</Link></li>
              <li><Link href="/minha-conta/pedidos" className="text-zinc-500 text-sm hover:text-white transition-colors">Meus Pedidos</Link></li>
              <li><Link href="/loja" className="text-zinc-500 text-sm hover:text-white transition-colors">Ver Produtos</Link></li>
            </ul>
          </div>

          {/* Contato */}
          <div>
            <h4 className="font-semibold text-white text-sm mb-3">Contato</h4>
            <ul className="space-y-2.5">
              <li>
                <a href="https://wa.me/5534999365936" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-green-500 text-sm hover:text-green-400 transition-colors">
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                  (34) 99936-5936
                </a>
              </li>
              <li>
                <a href="tel:3499936-5936" className="flex items-center gap-2 text-zinc-500 text-sm hover:text-white transition-colors">
                  <Phone className="h-4 w-4" aria-hidden="true" />
                  (34) 99936-5936
                </a>
              </li>
              <li className="flex items-center gap-2 text-zinc-500 text-sm">
                <MapPin className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                Minas Gerais, Brasil
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-8 pt-6 border-t border-zinc-800/50 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-zinc-600 text-xs">&copy; 2025-2026 Mosca Branca Parts. Todos os direitos reservados.</p>
          <p className="text-zinc-700 text-xs">CNPJ: 00.000.000/0001-00</p>
        </div>
      </div>
    </footer>
  )
}

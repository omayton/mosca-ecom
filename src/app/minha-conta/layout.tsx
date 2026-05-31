import Link from "next/link"
import { User, Package, ArrowLeft } from "lucide-react"

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <div className="container mx-auto px-4 py-8">
        <Link
          href="/"
          className="flex items-center gap-1 font-inter text-sm text-zinc-500 hover:text-zinc-700 mb-6 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar à loja
        </Link>

        <h1 className="font-barlow font-bold text-2xl text-zinc-900 mb-6">Minha Conta</h1>

        <div className="flex flex-col md:flex-row gap-6">
          <nav className="w-full md:w-56 flex-shrink-0">
            <ul className="bg-white border border-zinc-100 rounded-xl overflow-hidden shadow-sm">
              <li>
                <Link
                  href="/minha-conta"
                  className="flex items-center gap-3 px-4 py-3.5 font-inter text-sm text-zinc-700 hover:bg-zinc-50 transition-colors cursor-pointer"
                >
                  <User className="h-4 w-4 text-zinc-400" />
                  Meu Perfil
                </Link>
              </li>
              <li className="border-t border-zinc-100">
                <Link
                  href="/minha-conta/pedidos"
                  className="flex items-center gap-3 px-4 py-3.5 font-inter text-sm text-zinc-700 hover:bg-zinc-50 transition-colors cursor-pointer"
                >
                  <Package className="h-4 w-4 text-zinc-400" />
                  Meus Pedidos
                </Link>
              </li>
            </ul>
          </nav>

          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </div>
  )
}

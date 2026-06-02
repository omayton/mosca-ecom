import Link from "next/link"
import { TopHeader } from "@/components/automotive/top-header"
import { Search, Home, ArrowLeft } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <TopHeader />
      <main className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-md mx-auto">
          <p className="text-8xl font-barlow font-black text-zinc-200 mb-4">404</p>
          <h1 className="font-inter font-bold text-zinc-900 text-2xl mb-3">Página não encontrada</h1>
          <p className="font-inter text-zinc-500 text-sm mb-8">
            A página que você procura não existe ou foi movida.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-inter font-semibold text-sm px-6 py-3 rounded-lg transition-colors cursor-pointer"
            >
              <Home className="h-4 w-4" />
              Ir para o início
            </Link>
            <Link
              href="/loja"
              className="inline-flex items-center gap-2 border border-zinc-200 hover:border-zinc-400 text-zinc-700 font-inter font-medium text-sm px-6 py-3 rounded-lg transition-colors cursor-pointer"
            >
              <Search className="h-4 w-4" />
              Ver produtos
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}

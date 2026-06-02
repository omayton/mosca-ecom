'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[app-error]', error)
  }, [error])

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="h-8 w-8 text-red-600" />
        </div>
        <h1 className="font-inter font-bold text-zinc-900 text-2xl mb-2">Algo deu errado</h1>
        <p className="font-inter text-zinc-500 text-sm mb-8">
          Ocorreu um erro inesperado. Tente novamente ou volte para a página inicial.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-inter font-semibold text-sm px-6 py-3 rounded-lg transition-colors cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" />
            Tentar novamente
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 border border-zinc-200 hover:border-zinc-400 text-zinc-700 font-inter font-medium text-sm px-6 py-3 rounded-lg transition-colors cursor-pointer"
          >
            <Home className="h-4 w-4" />
            Página inicial
          </Link>
        </div>
      </div>
    </div>
  )
}

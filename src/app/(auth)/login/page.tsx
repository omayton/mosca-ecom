import { Suspense } from "react"
import { LoginForm } from "@/components/auth/login-form"
import { GoogleLoginButton } from "@/components/auth/google-login-button"
import { TopHeader } from "@/components/automotive/top-header"
import Link from "next/link"
import { ShieldCheck, Truck, Clock } from "lucide-react"

export const metadata = {
  title: "Entrar | Mosca Branca Parts",
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <TopHeader />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          {/* Trust badge */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="h-px bg-zinc-200 flex-1" />
            <div className="flex items-center gap-1.5 text-xs text-zinc-400">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Ambiente seguro</span>
            </div>
            <div className="h-px bg-zinc-200 flex-1" />
          </div>

          <div className="bg-white border border-zinc-100 shadow-sm p-8 rounded-2xl">
            <div className="text-center mb-6">
              <h1 className="font-bold text-zinc-900 text-2xl mb-1">Bem-vindo de volta</h1>
              <p className="text-sm text-zinc-500">
                Acesse sua conta para acompanhar pedidos e favoritos.
              </p>
            </div>

            <Suspense fallback={null}>
              <LoginForm />
            </Suspense>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-100" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-3 text-zinc-400">ou continue com</span>
              </div>
            </div>

            <GoogleLoginButton />

            <p className="text-sm text-zinc-500 text-center mt-6">
              Não tem conta?{" "}
              <Link href="/registro" className="text-red-600 hover:text-red-700 font-medium transition-colors">
                Criar conta
              </Link>
            </p>
          </div>

          {/* Trust signals */}
          <div className="mt-8 grid grid-cols-3 gap-3">
            <div className="flex flex-col items-center gap-1.5 text-center">
              <div className="h-9 w-9 rounded-full bg-green-50 flex items-center justify-center">
                <ShieldCheck className="h-4.5 w-4.5 text-green-600" />
              </div>
              <span className="text-[11px] text-zinc-500 leading-tight">Compra<br/>segura</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 text-center">
              <div className="h-9 w-9 rounded-full bg-blue-50 flex items-center justify-center">
                <Truck className="h-4.5 w-4.5 text-blue-600" />
              </div>
              <span className="text-[11px] text-zinc-500 leading-tight">Frete para<br/>todo Brasil</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 text-center">
              <div className="h-9 w-9 rounded-full bg-amber-50 flex items-center justify-center">
                <Clock className="h-4.5 w-4.5 text-amber-600" />
              </div>
              <span className="text-[11px] text-zinc-500 leading-tight">Suporte<br/>rápido</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

import { Suspense } from "react"
import { LoginForm } from "@/components/auth/login-form"
import { GoogleLoginButton } from "@/components/auth/google-login-button"
import { TopHeader } from "@/components/automotive/top-header"
import Link from "next/link"

export const metadata = {
  title: "Entrar | Mosca Branca Parts",
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <TopHeader />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto bg-white border border-zinc-100 shadow-sm p-8 rounded-2xl">
          <h1 className="font-bold text-zinc-900 text-2xl mb-2">Entrar</h1>
          <p className="text-sm text-zinc-500 mb-6">
            Acesse sua conta para acompanhar pedidos e favoritos.
          </p>

          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-2 text-zinc-400">ou</span>
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
      </main>
    </div>
  )
}

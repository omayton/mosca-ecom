import { RegisterForm } from "@/components/auth/register-form"
import { TopHeader } from "@/components/automotive/top-header"
import Link from "next/link"

export const metadata = {
  title: "Criar conta | Mosca Branca Parts",
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <TopHeader />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto bg-white border border-zinc-100 shadow-sm p-8 rounded-2xl">
          <h1 className="font-inter font-bold text-zinc-900 text-2xl mb-2">Criar conta</h1>
          <p className="font-inter text-sm text-zinc-500 mb-6">
            Cadastre-se para comprar e acompanhar seus pedidos.
          </p>

          <RegisterForm />

          <p className="font-inter text-sm text-zinc-500 text-center mt-6">
            Já tem conta?{" "}
            <Link href="/login" className="text-red-600 hover:text-red-700 font-medium transition-colors">
              Entrar
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}

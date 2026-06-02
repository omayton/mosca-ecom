"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { User, LogOut, Package, ChevronDown } from "lucide-react"

interface UserData {
  email: string
  name?: string
}

export function AuthStatus() {
  const router = useRouter()
  const [user, setUser] = useState<UserData | null>(null)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data?.user) setUser(data.user)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" })
    setUser(null)
    setOpen(false)
    router.refresh()
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-zinc-300 px-3 py-2 min-h-[44px]">
        <User className="h-5 w-5 text-zinc-400 flex-shrink-0" aria-hidden="true" />
        <div className="text-xs leading-tight">
          <p className="text-zinc-500">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <a href="/login" className="flex items-center gap-2 text-zinc-300 hover:text-white px-3 py-2 min-h-[44px] transition-colors duration-150">
        <User className="h-5 w-5 text-zinc-400 flex-shrink-0" aria-hidden="true" />
        <div className="text-xs leading-tight">
          <p className="text-zinc-500">Bem-vindo!</p>
          <p className="font-semibold">Entre ou cadastre-se</p>
        </div>
      </a>
    )
  }

  const displayName = user.name || user.email.split("@")[0]

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-zinc-300 hover:text-white px-3 py-2 min-h-[44px] transition-colors duration-150 cursor-pointer"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <User className="h-5 w-5 text-zinc-400 flex-shrink-0" aria-hidden="true" />
        <div className="text-xs leading-tight">
          <p className="text-zinc-500">Olá,</p>
          <p className="font-semibold max-w-[100px] truncate">{displayName}</p>
        </div>
        <ChevronDown className="h-3.5 w-3.5 text-zinc-400" aria-hidden="true" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-zinc-200 shadow-lg z-50 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-100">
              <p className="font-inter text-sm font-medium text-zinc-900 truncate">{displayName}</p>
              <p className="font-inter text-xs text-zinc-500 truncate">{user.email}</p>
            </div>
            <nav className="py-1">
              <a
                href="/minha-conta"
                className="flex items-center gap-2 px-4 py-2.5 font-inter text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
              >
                <User className="h-4 w-4" aria-hidden="true" />
                Minha conta
              </a>
              <a
                href="/minha-conta/pedidos"
                className="flex items-center gap-2 px-4 py-2.5 font-inter text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
              >
                <Package className="h-4 w-4" aria-hidden="true" />
                Meus pedidos
              </a>
              <div className="border-t border-zinc-100 my-1" />
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2.5 font-inter text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Sair
              </button>
            </nav>
          </div>
        </>
      )}
    </div>
  )
}

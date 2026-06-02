"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { User, LogOut, Package, ChevronDown } from "lucide-react"

interface UserMenuProps {
  userName: string | null
  userEmail: string
}

export function UserMenu({ userName, userEmail }: UserMenuProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/")
    router.refresh()
  }

  const displayName = userName || userEmail.split("@")[0]

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-zinc-700 hover:text-zinc-900 text-sm transition-colors cursor-pointer"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <User className="h-4 w-4" aria-hidden="true" />
        <span className="hidden sm:inline max-w-[120px] truncate">{displayName}</span>
        <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-zinc-200 shadow-lg z-50 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-100">
              <p className="text-sm font-medium text-zinc-900 truncate">{displayName}</p>
              <p className="text-xs text-zinc-500 truncate">{userEmail}</p>
            </div>
            <nav className="py-1">
              <a
                href="/minha-conta/pedidos"
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors"
              >
                <Package className="h-4 w-4" aria-hidden="true" />
                Meus pedidos
              </a>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors cursor-pointer"
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

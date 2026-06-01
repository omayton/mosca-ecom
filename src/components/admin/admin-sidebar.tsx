'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Package,
  Boxes,
  Tag,
  Users,
  ShoppingCart,
  Brain,
  ChevronLeft,
  Menu,
  ExternalLink
} from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/produtos', label: 'Produtos', icon: Package },
  { href: '/admin/estoque', label: 'Estoque', icon: Boxes },
  { href: '/admin/cupons', label: 'Cupons', icon: Tag },
  { href: '/admin/clientes', label: 'Clientes', icon: Users },
  { href: '/admin/pedidos', label: 'Pedidos', icon: ShoppingCart },
  { href: '/admin/analytics', label: 'Analytics IA', icon: Brain },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside className={`
      fixed left-0 top-0 h-full z-40
      transition-all duration-300 flex flex-col
      bg-[#111113] border-r border-white/[0.06]
      ${collapsed ? 'w-[72px]' : 'w-64'}
    `}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-[72px] border-b border-white/[0.06]">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center">
              <span className="text-xs font-black text-black">MB</span>
            </div>
            <div>
              <span className="text-sm font-semibold text-white/90 tracking-tight">Mosca Branca</span>
              <p className="text-[10px] text-white/30 uppercase tracking-widest">Admin Panel</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center mx-auto">
            <span className="text-xs font-black text-black">MB</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`p-1.5 rounded-md hover:bg-white/[0.06] transition-colors text-white/40 hover:text-white/70 ${collapsed ? 'hidden' : ''}`}
          aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 overflow-y-auto">
        {!collapsed && (
          <p className="px-5 mb-3 text-[10px] font-medium text-white/20 uppercase tracking-[0.2em]">
            Menu
          </p>
        )}
        <ul className="space-y-0.5 px-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/admin' && pathname.startsWith(item.href))

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium
                    transition-all duration-200 cursor-pointer relative group
                    ${isActive
                      ? 'bg-gradient-to-r from-amber-500/10 to-transparent text-amber-400 border border-amber-500/20'
                      : 'text-white/40 hover:text-white/80 hover:bg-white/[0.04] border border-transparent'
                    }
                  `}
                  title={collapsed ? item.label : undefined}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 bg-amber-400 rounded-r-full" />
                  )}
                  <item.icon className={`h-[18px] w-[18px] flex-shrink-0 ${isActive ? 'text-amber-400' : 'text-white/30 group-hover:text-white/60'}`} />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-white/[0.06]">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] text-white/30 hover:text-white/60 hover:bg-white/[0.04] transition-all"
        >
          <ExternalLink className="h-[18px] w-[18px] flex-shrink-0" />
          {!collapsed && <span>Voltar ao Site</span>}
        </Link>
      </div>
    </aside>
  )
}
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
  BarChart3,
  Settings,
  Brain,
  ChevronLeft,
  Menu
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
      fixed left-0 top-0 h-full bg-zinc-900 text-white z-40
      transition-all duration-200 flex flex-col
      ${collapsed ? 'w-16' : 'w-64'}
    `}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-16 border-b border-zinc-800">
        {!collapsed && (
          <span className="font-bold text-sm text-white">Mosca Branca Admin</span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 rounded-lg hover:bg-zinc-800 transition-colors"
          aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
        >
          {collapsed ? <Menu className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/admin' && pathname.startsWith(item.href))

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                    transition-colors duration-150 cursor-pointer
                    ${isActive
                      ? 'bg-red-600 text-white'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                    }
                  `}
                  title={collapsed ? item.label : undefined}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="px-2 py-4 border-t border-zinc-800">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          <Settings className="h-5 w-5 flex-shrink-0" />
          {!collapsed && <span>Voltar ao Site</span>}
        </Link>
      </div>
    </aside>
  )
}
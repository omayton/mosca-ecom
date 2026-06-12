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
  X,
  ExternalLink,
  Image,
  Layers,
  BarChart3,
  Star,
  AlertCircle
} from 'lucide-react'
import { useEffect } from 'react'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/banners', label: 'Banners', icon: Image },
  { href: '/admin/produtos', label: 'Produtos', icon: Package },
  { href: '/admin/categorias', label: 'Categorias', icon: Layers },
  { href: '/admin/estoque', label: 'Estoque', icon: Boxes },
  { href: '/admin/cupons', label: 'Cupons', icon: Tag },
  { href: '/admin/avaliacoes', label: 'Avaliações', icon: Star },
  { href: '/admin/clientes', label: 'Clientes', icon: Users },
  { href: '/admin/pedidos', label: 'Pedidos', icon: ShoppingCart },
  { href: '/admin/carrinhos-abandonados', label: 'Carrinhos', icon: AlertCircle },
  { href: '/admin/relatorios', label: 'Relatórios', icon: BarChart3 },
  { href: '/admin/analytics', label: 'Analytics IA', icon: Brain },
]

interface AdminSidebarProps {
  mobileOpen?: boolean
  onMobileClose?: () => void
  collapsed?: boolean
  onCollapse?: () => void
}

export function AdminSidebar({ mobileOpen, onMobileClose, collapsed = false, onCollapse }: AdminSidebarProps) {
  const pathname = usePathname()

  // Close mobile sidebar on navigation
  useEffect(() => {
    if (mobileOpen && onMobileClose) {
      onMobileClose()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed left-0 top-0 h-full z-50
        transition-all duration-300 flex flex-col
        bg-[#111113] border-r border-white/[0.06]
        ${collapsed ? 'w-[72px]' : 'w-64'}
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 h-[64px] border-b border-white/[0.06]">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center">
                <span className="text-xs font-black text-black">MB</span>
              </div>
              <div>
                <span className="text-sm font-semibold text-white/90 tracking-tight">Mosca Branca</span>
                <p className="text-[10px] text-white/30 uppercase tracking-widest">Admin</p>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center mx-auto">
              <span className="text-xs font-black text-black">MB</span>
            </div>
          )}

          {/* Close button mobile */}
          <button
            onClick={onMobileClose}
            className="p-1.5 rounded-md hover:bg-white/[0.06] transition-colors text-white/40 hover:text-white/70 lg:hidden cursor-pointer"
            aria-label="Fechar menu"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Collapse button desktop */}
          <button
            onClick={onCollapse}
            className="p-1.5 rounded-md hover:bg-white/[0.06] transition-colors text-white/40 hover:text-white/70 hidden lg:flex items-center justify-center cursor-pointer"
            aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
          >
            <ChevronLeft className={`h-4 w-4 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto">
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
    </>
  )
}

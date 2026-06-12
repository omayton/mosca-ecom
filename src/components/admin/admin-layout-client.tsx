'use client'

import { useState } from 'react'
import { Menu } from 'lucide-react'
import { AdminSidebar } from './admin-sidebar'

export function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="min-h-screen bg-[#0a0a0b]">
      <AdminSidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        collapsed={collapsed}
        onCollapse={() => setCollapsed(!collapsed)}
      />

      {/* Mobile header */}
      <div className="fixed top-0 left-0 right-0 h-[64px] bg-[#0a0a0b] border-b border-white/[0.06] flex items-center px-4 z-30 lg:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg hover:bg-white/[0.06] text-white/50 hover:text-white/80 transition-colors cursor-pointer"
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2 ml-3">
          <div className="w-7 h-7 rounded-md bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center">
            <span className="text-[10px] font-black text-black">MB</span>
          </div>
          <span className="text-sm font-semibold text-white/80">Admin</span>
        </div>
      </div>

      {/* Main content — margin follows sidebar width */}
      <div className={`min-h-screen pt-[64px] lg:pt-0 transition-all duration-300 ${collapsed ? 'lg:ml-[72px]' : 'lg:ml-64'}`}>
        {children}
      </div>
    </div>
  )
}

import { AdminSidebar } from '@/components/admin/admin-sidebar'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-50">
      <AdminSidebar />
      <div className="ml-64 min-h-screen">
        {children}
      </div>
    </div>
  )
}
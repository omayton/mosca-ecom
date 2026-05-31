import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Package, ChevronRight } from "lucide-react"
import { fmt } from "@/lib/products"

export const revalidate = 0

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "Aguardando", color: "text-amber-700 bg-amber-50" },
  confirmed: { label: "Confirmado", color: "text-green-700 bg-green-50" },
  shipped: { label: "Enviado", color: "text-blue-700 bg-blue-50" },
  delivered: { label: "Entregue", color: "text-green-800 bg-green-100" },
  cancelled: { label: "Cancelado", color: "text-red-700 bg-red-50" },
}

async function getOrders() {
  const cookieStore = cookies()
  const accessToken = cookieStore.get("sb-access-token")?.value
  if (!accessToken) redirect("/login?redirect=/minha-conta/pedidos")

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
      auth: { persistSession: false },
    }
  )

  const { data } = await supabase
    .from("orders")
    .select("id, status, total, shipping_method, created_at, order_items(quantity)")
    .order("created_at", { ascending: false })

  return data || []
}

export default async function OrdersPage() {
  const orders = await getOrders()

  if (orders.length === 0) {
    return (
      <div className="bg-white border border-zinc-100 rounded-xl p-8 shadow-sm text-center">
        <Package className="h-10 w-10 text-zinc-300 mx-auto mb-3" />
        <p className="font-inter text-zinc-600">Você ainda não fez nenhum pedido.</p>
        <Link
          href="/"
          className="inline-block mt-4 font-inter text-sm text-red-600 hover:text-red-700 font-semibold cursor-pointer"
        >
          Explorar produtos
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <h2 className="font-inter font-semibold text-lg text-zinc-900 mb-4">Meus Pedidos</h2>
      {orders.map((order: any) => {
        const status = STATUS_LABELS[order.status] || STATUS_LABELS.pending
        const totalItems = order.order_items?.reduce((sum: number, i: any) => sum + i.quantity, 0) || 0

        return (
          <Link
            key={order.id}
            href={`/minha-conta/pedidos/${order.id}`}
            className="flex items-center gap-4 bg-white border border-zinc-100 hover:border-zinc-200 hover:shadow-md rounded-xl p-4 transition-all duration-200 cursor-pointer"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <span className="font-inter font-semibold text-sm text-zinc-900">
                  Pedido #{order.id}
                </span>
                <span className={`px-2 py-0.5 rounded-full font-inter text-xs font-medium ${status.color}`}>
                  {status.label}
                </span>
              </div>
              <p className="font-inter text-xs text-zinc-500">
                {new Date(order.created_at).toLocaleDateString("pt-BR")} — {totalItems} {totalItems === 1 ? "item" : "itens"}
              </p>
            </div>
            <span className="font-barlow font-bold text-zinc-900">R$ {fmt(order.total)}</span>
            <ChevronRight className="h-4 w-4 text-zinc-400 flex-shrink-0" />
          </Link>
        )
      })}
    </div>
  )
}

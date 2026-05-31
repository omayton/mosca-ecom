import { notFound, redirect } from "next/navigation"
import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"
import { CheckCircle2, Clock, XCircle, Package, MapPin, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { fmt } from "@/lib/products"

export const revalidate = 0

const STATUS_MAP: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "Aguardando pagamento", color: "text-amber-600 bg-amber-50", icon: Clock },
  confirmed: { label: "Pagamento confirmado", color: "text-green-600 bg-green-50", icon: CheckCircle2 },
  shipped: { label: "Enviado", color: "text-blue-600 bg-blue-50", icon: Package },
  delivered: { label: "Entregue", color: "text-green-700 bg-green-50", icon: CheckCircle2 },
  cancelled: { label: "Cancelado", color: "text-red-600 bg-red-50", icon: XCircle },
}

async function getOrder(id: string) {
  const cookieStore = cookies()
  const accessToken = cookieStore.get("sb-access-token")?.value
  if (!accessToken) redirect("/login?redirect=/minha-conta/pedidos/" + id)

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
    .select("*, order_items(*, products(name, image_file))")
    .eq("id", Number(id))
    .single()

  return data
}

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const order = await getOrder(params.id)
  if (!order) notFound()

  const statusInfo = STATUS_MAP[order.status] || STATUS_MAP.pending
  const StatusIcon = statusInfo.icon
  const address = order.address_json as any

  return (
    <div className="space-y-6">
      <Link
        href="/minha-conta/pedidos"
        className="flex items-center gap-1 font-inter text-sm text-zinc-500 hover:text-zinc-700 cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar aos pedidos
      </Link>

      <div className="bg-white border border-zinc-100 rounded-xl p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-barlow font-bold text-xl text-zinc-900">Pedido #{order.id}</h2>
            <p className="font-inter text-xs text-zinc-500 mt-1">
              {new Date(order.created_at).toLocaleDateString("pt-BR", {
                day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
              })}
            </p>
          </div>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-inter text-xs font-medium ${statusInfo.color}`}>
            <StatusIcon className="h-3.5 w-3.5" />
            {statusInfo.label}
          </span>
        </div>

        <div className="border-t border-zinc-100 pt-4">
          <h3 className="font-inter text-sm font-semibold text-zinc-900 mb-3">Itens</h3>
          <div className="divide-y divide-zinc-100">
            {order.order_items?.map((item: any) => (
              <div key={item.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-inter text-sm text-zinc-900">
                    {item.products?.name || `Produto #${item.product_id}`}
                  </p>
                  <p className="font-inter text-xs text-zinc-500">Qtd: {item.quantity}</p>
                </div>
                <span className="font-barlow font-bold text-sm text-zinc-900">
                  R$ {fmt(item.unit_price * item.quantity)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-zinc-100 pt-4 space-y-2">
          <div className="flex justify-between font-inter text-sm">
            <span className="text-zinc-600">Subtotal</span>
            <span>R$ {fmt(order.total - (order.shipping_cost || 0))}</span>
          </div>
          <div className="flex justify-between font-inter text-sm">
            <span className="text-zinc-600">Frete ({order.shipping_method})</span>
            <span>R$ {fmt(order.shipping_cost || 0)}</span>
          </div>
          <div className="flex justify-between font-inter font-semibold border-t border-zinc-100 pt-2">
            <span>Total</span>
            <span className="font-barlow font-bold text-lg">R$ {fmt(order.total)}</span>
          </div>
        </div>

        {address && (
          <div className="border-t border-zinc-100 pt-4">
            <h3 className="font-inter text-sm font-semibold text-zinc-900 mb-2 flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-zinc-400" />
              Endereço de entrega
            </h3>
            <p className="font-inter text-sm text-zinc-600">
              {address.logradouro}, {address.numero}
              {address.complemento ? ` — ${address.complemento}` : ""}
            </p>
            <p className="font-inter text-sm text-zinc-600">
              {address.bairro} — {address.cidade}/{address.estado}
            </p>
            <p className="font-inter text-sm text-zinc-600">CEP: {address.cep}</p>
          </div>
        )}
      </div>
    </div>
  )
}

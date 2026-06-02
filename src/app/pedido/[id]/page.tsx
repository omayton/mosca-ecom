import { notFound, redirect } from "next/navigation"
import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"
import { CheckCircle2, Clock, XCircle, Package, MapPin, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { fmt } from "@/lib/products"
import { TopHeader } from "@/components/automotive/top-header"

export const revalidate = 0

async function getOrder(id: string) {
  const cookieStore = cookies()
  const accessToken = cookieStore.get("sb-access-token")?.value

  if (!accessToken) redirect("/login?redirect=/pedido/" + id)

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
      auth: { persistSession: false },
    }
  )

  const { data: order } = await supabase
    .from("orders")
    .select("*, order_items(*, products(name, image_file))")
    .eq("id", Number(id))
    .single()

  return order
}

const STATUS_MAP: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "Aguardando pagamento", color: "text-amber-600 bg-amber-50", icon: Clock },
  confirmed: { label: "Pagamento confirmado", color: "text-green-600 bg-green-50", icon: CheckCircle2 },
  shipped: { label: "Enviado", color: "text-blue-600 bg-blue-50", icon: Package },
  delivered: { label: "Entregue", color: "text-green-700 bg-green-50", icon: CheckCircle2 },
  cancelled: { label: "Cancelado", color: "text-red-600 bg-red-50", icon: XCircle },
}

export default async function OrderPage({ params, searchParams }: { params: { id: string }; searchParams: { status?: string } }) {
  const order = await getOrder(params.id)
  if (!order) notFound()

  const paymentStatus = searchParams.status
  const statusInfo = STATUS_MAP[order.status] || STATUS_MAP.pending
  const StatusIcon = statusInfo.icon
  const address = order.address_json as any

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <TopHeader />
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Link
          href="/minha-conta/pedidos"
          className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-700 mb-6 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Meus pedidos
        </Link>

        {paymentStatus === "approved" && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6 text-center">
            <CheckCircle2 className="h-10 w-10 text-green-600 mx-auto mb-3" />
            <h2 className="font-bold text-xl text-green-800">Pagamento aprovado!</h2>
            <p className="text-sm text-green-700 mt-1">
              Seu pedido foi confirmado e será preparado para envio.
            </p>
          </div>
        )}

        {paymentStatus === "pending" && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-6 text-center">
            <Clock className="h-10 w-10 text-amber-600 mx-auto mb-3" />
            <h2 className="font-bold text-xl text-amber-800">Aguardando pagamento</h2>
            <p className="text-sm text-amber-700 mt-1">
              Assim que o pagamento for confirmado, seu pedido será processado.
            </p>
          </div>
        )}

        {paymentStatus === "rejected" && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6 text-center">
            <XCircle className="h-10 w-10 text-red-600 mx-auto mb-3" />
            <h2 className="font-bold text-xl text-red-800">Pagamento não aprovado</h2>
            <p className="text-sm text-red-700 mt-1">
              Houve um problema com o pagamento. Tente novamente ou escolha outro método.
            </p>
          </div>
        )}

        <div className="bg-white border border-zinc-100 rounded-xl p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-bold text-xl text-zinc-900">
                Pedido #{order.id}
              </h1>
              <p className="text-xs text-zinc-500 mt-1">
                {new Date(order.created_at).toLocaleDateString("pt-BR", {
                  day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
                })}
              </p>
            </div>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
              <StatusIcon className="h-3.5 w-3.5" />
              {statusInfo.label}
            </span>
          </div>

          <div className="border-t border-zinc-100 pt-4">
            <h3 className="text-sm font-semibold text-zinc-900 mb-3">Itens</h3>
            <div className="divide-y divide-zinc-100">
              {order.order_items?.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm text-zinc-900">
                      {item.products?.name || `Produto #${item.product_id}`}
                    </p>
                    <p className="text-xs text-zinc-500">Qtd: {item.quantity}</p>
                  </div>
                  <span className="font-bold text-sm text-zinc-900">
                    R$ {fmt(item.unit_price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-zinc-100 pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-600">Subtotal</span>
              <span>R$ {fmt(order.total - (order.shipping_cost || 0))}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-600">Frete ({order.shipping_method})</span>
              <span>R$ {fmt(order.shipping_cost || 0)}</span>
            </div>
            <div className="flex justify-between font-semibold border-t border-zinc-100 pt-2">
              <span>Total</span>
              <span className="font-bold text-lg">R$ {fmt(order.total)}</span>
            </div>
          </div>

          {address && (
            <div className="border-t border-zinc-100 pt-4">
              <h3 className="text-sm font-semibold text-zinc-900 mb-2 flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-zinc-400" />
                Endereço de entrega
              </h3>
              <p className="text-sm text-zinc-600">
                {address.logradouro}, {address.numero}
                {address.complemento ? ` — ${address.complemento}` : ""}
              </p>
              <p className="text-sm text-zinc-600">
                {address.bairro} — {address.cidade}/{address.estado}
              </p>
              <p className="text-sm text-zinc-600">CEP: {address.cep}</p>
            </div>
          )}
        </div>
      </div>

      <footer className="bg-zinc-950 border-t border-zinc-800/50 mt-10 py-8" role="contentinfo">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-xs text-zinc-600">© 2025 Mosca Branca Parts. Todos os direitos reservados.</p>
          <p className="text-xs text-zinc-600">Pix · Cartão · Boleto · Parcelamento em até 6x sem juros</p>
        </div>
      </footer>
    </div>
  )
}

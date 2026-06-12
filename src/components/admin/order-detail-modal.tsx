"use client"

import { useState, useEffect } from "react"
import { X, Package, MapPin, CreditCard, User, Phone, Mail, ExternalLink, Truck } from "lucide-react"

interface OrderDetail {
  id: number
  status: string
  total: number
  shipping_cost: number
  shipping_method: string
  payment_method: string
  payment_id: string
  cpf: string
  created_at: string
  updated_at: string
  address_json: {
    cep?: string
    logradouro?: string
    numero?: string
    complemento?: string
    bairro?: string
    cidade?: string
    estado?: string
    telefone?: string
  }
  customer: {
    name: string
    email: string
    phone: string
  }
  items: {
    id: number
    productId: number
    name: string
    imageFile: string
    slug: string
    category: string
    quantity: number
    unitPrice: number
    total: number
  }[]
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:   { label: "Pendente",   color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  confirmed: { label: "Confirmado", color: "bg-green-500/20 text-green-400 border-green-500/30" },
  shipped:   { label: "Enviado",    color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  delivered: { label: "Entregue",   color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  cancelled: { label: "Cancelado",  color: "bg-red-500/20 text-red-400 border-red-500/30" },
}

function fmt(n: number) {
  return n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

function ProductImage({ imageFile, name }: { imageFile: string; name: string }) {
  const src = imageFile?.startsWith("http")
    ? imageFile
    : imageFile
    ? `https://www.moscabrancaparts.com.br/wp-content/uploads/2026/04/${imageFile}`
    : ""

  if (!src) {
    return (
      <div className="w-14 h-14 bg-white/5 rounded-lg flex items-center justify-center flex-shrink-0">
        <Package className="h-6 w-6 text-white/20" />
      </div>
    )
  }

  return (
    <div className="w-14 h-14 bg-white/5 rounded-lg overflow-hidden flex-shrink-0">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={name} className="w-full h-full object-contain p-1" />
    </div>
  )
}

interface Props {
  orderId: number | null
  onClose: () => void
  onStatusChange?: () => void
}

export function OrderDetailModal({ orderId, onClose, onStatusChange }: Props) {
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState(false)

  useEffect(() => {
    if (!orderId) return
    setLoading(true)
    setError(null)
    setOrder(null)

    fetch(`/api/admin/orders/${orderId}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) setError(data.error)
        else setOrder(data.order)
      })
      .catch(() => setError("Erro ao carregar pedido"))
      .finally(() => setLoading(false))
  }, [orderId])

  const updateStatus = async (newStatus: string) => {
    if (!order) return
    setUpdatingStatus(true)
    try {
      await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: order.id, status: newStatus }),
      })
      setOrder(prev => prev ? { ...prev, status: newStatus } : prev)
      onStatusChange?.()
    } finally {
      setUpdatingStatus(false)
    }
  }

  if (!orderId) return null

  const statusInfo = order ? STATUS_LABELS[order.status] || { label: order.status, color: "bg-white/10 text-white/60 border-white/10" } : null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <aside
        role="dialog"
        aria-label={`Detalhes do pedido #${orderId}`}
        className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-2xl bg-[#111113] border-l border-white/[0.06] flex flex-col shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <div>
            <h2 className="text-white font-semibold text-lg">Pedido #{orderId}</h2>
            {order && (
              <p className="text-white/40 text-xs mt-0.5">{formatDate(order.created_at)}</p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="w-9 h-9 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading && (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {order && (
            <>
              {/* Status + Alterar */}
              <div className="flex items-center justify-between">
                <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border ${statusInfo?.color}`}>
                  {statusInfo?.label}
                </span>
                <select
                  value={order.status}
                  onChange={e => updateStatus(e.target.value)}
                  disabled={updatingStatus}
                  className="text-sm bg-white/[0.04] border border-white/[0.08] text-white/70 rounded-lg px-3 py-1.5 focus:outline-none focus:border-amber-500/50 cursor-pointer disabled:opacity-50"
                >
                  {Object.entries(STATUS_LABELS).map(([v, { label }]) => (
                    <option key={v} value={v}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Cliente */}
              <section>
                <h3 className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-3 flex items-center gap-2">
                  <User className="h-3.5 w-3.5" /> Cliente
                </h3>
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 space-y-2.5">
                  <p className="text-white font-medium">{order.customer.name}</p>
                  {order.customer.email && (
                    <div className="flex items-center gap-2 text-white/60 text-sm">
                      <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                      {order.customer.email}
                    </div>
                  )}
                  {order.customer.phone && (
                    <div className="flex items-center gap-2 text-white/60 text-sm">
                      <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                      {order.customer.phone}
                    </div>
                  )}
                  {order.cpf && (
                    <div className="flex items-center gap-2 text-white/60 text-sm">
                      <CreditCard className="h-3.5 w-3.5 flex-shrink-0" />
                      CPF: {order.cpf}
                    </div>
                  )}
                </div>
              </section>

              {/* Endereço */}
              {order.address_json && (
                <section>
                  <h3 className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-3 flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5" /> Endereço de entrega
                  </h3>
                  <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4">
                    <p className="text-white text-sm leading-relaxed">
                      {order.address_json.logradouro}{order.address_json.numero ? `, ${order.address_json.numero}` : ""}
                      {order.address_json.complemento ? ` — ${order.address_json.complemento}` : ""}
                    </p>
                    <p className="text-white/60 text-sm mt-1">
                      {order.address_json.bairro} · {order.address_json.cidade}/{order.address_json.estado}
                    </p>
                    <p className="text-white/40 text-xs mt-1">CEP: {order.address_json.cep}</p>
                  </div>
                </section>
              )}

              {/* Itens */}
              <section>
                <h3 className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Package className="h-3.5 w-3.5" /> Itens do pedido ({order.items.length})
                </h3>
                <div className="space-y-2">
                  {order.items.map(item => (
                    <div key={item.id} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 flex items-center gap-3">
                      <ProductImage imageFile={item.imageFile} name={item.name} />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium line-clamp-2">{item.name}</p>
                        <p className="text-white/40 text-xs mt-0.5">{item.category}</p>
                        <p className="text-white/60 text-xs mt-1">
                          {item.quantity}x · R$ {fmt(item.unitPrice)} cada
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-white font-semibold text-sm">R$ {fmt(item.total)}</p>
                        <a
                          href={`/produto/${item.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-amber-400/60 hover:text-amber-400 text-xs flex items-center gap-1 mt-1 transition-colors"
                        >
                          Ver <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Pagamento + Frete */}
              <section>
                <h3 className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-3 flex items-center gap-2">
                  <CreditCard className="h-3.5 w-3.5" /> Pagamento e frete
                </h3>
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 space-y-2">
                  {order.payment_method && (
                    <div className="flex justify-between text-sm">
                      <span className="text-white/50">Forma de pagamento</span>
                      <span className="text-white font-medium capitalize">
                        {order.payment_method === "pix" ? "PIX" : order.payment_method}
                      </span>
                    </div>
                  )}
                  {order.payment_id && (
                    <div className="flex justify-between text-sm">
                      <span className="text-white/50">ID pagamento</span>
                      <span className="text-white/70 font-mono text-xs">{order.payment_id}</span>
                    </div>
                  )}
                  {order.shipping_method && (
                    <div className="flex justify-between text-sm">
                      <span className="text-white/50 flex items-center gap-1"><Truck className="h-3.5 w-3.5" /> Frete</span>
                      <span className="text-white/70">{order.shipping_method}</span>
                    </div>
                  )}
                  <div className="border-t border-white/[0.06] pt-2 mt-2 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-white/50">Subtotal produtos</span>
                      <span className="text-white/70">R$ {fmt(order.total - (order.shipping_cost || 0))}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/50">Frete</span>
                      <span className="text-white/70">R$ {fmt(order.shipping_cost || 0)}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-base pt-1">
                      <span className="text-white">Total</span>
                      <span className="text-amber-400">R$ {fmt(order.total)}</span>
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}
        </div>
      </aside>
    </>
  )
}

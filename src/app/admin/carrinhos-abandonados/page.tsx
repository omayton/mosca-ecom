'use client'

import { useState, useEffect, useCallback } from 'react'
import { ShoppingCart, MessageCircle, Mail, Clock, CheckCircle } from 'lucide-react'
import { fmt } from '@/lib/products'
import {
  AdminPage, AdminHeader, AdminCard, AdminSelect, AdminFilter,
  AdminEmptyState, AdminBadge
} from '@/components/admin/admin-ui'

interface CartItemData {
  productId: number
  name: string
  price: number
  quantity: number
  slug: string
}

interface AbandonedCart {
  userId: string
  name: string | null
  email: string | null
  phone: string | null
  items: CartItemData[]
  total: number
  lastUpdate: string
  notifications: { whatsapp?: string; email?: string }
  recovered?: boolean
}

export default function AbandonedCartsPage() {
  const [carts, setCarts] = useState<AbandonedCart[]>([])
  const [loading, setLoading] = useState(true)
  const [hours, setHours] = useState('2')
  const [sendingId, setSendingId] = useState<string | null>(null)

  const fetchCarts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/abandoned-carts?hours=${hours}`)
      if (res.ok) {
        const data = await res.json()
        setCarts(data.carts || [])
      }
    } catch (err) {
      console.error('Failed to fetch abandoned carts:', err)
    } finally {
      setLoading(false)
    }
  }, [hours])

  useEffect(() => { fetchCarts() }, [fetchCarts])

  function getTimeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)
    if (days > 0) return `${days}d ${hours % 24}h atrás`
    return `${hours}h atrás`
  }

  async function handleRecover(userId: string, channel: 'whatsapp' | 'email') {
    setSendingId(`${userId}-${channel}`)
    try {
      const res = await fetch('/api/admin/abandoned-carts/recover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, channel }),
      })
      const data = await res.json()

      if (channel === 'whatsapp' && data.whatsappUrl) {
        window.open(data.whatsappUrl, '_blank')
      }

      if (res.ok) {
        fetchCarts()
      } else {
        alert(data.error || 'Erro ao enviar recuperação')
      }
    } catch {
      alert('Erro de conexão')
    } finally {
      setSendingId(null)
    }
  }

  const hoursOptions = [
    { value: '2', label: '2 horas' },
    { value: '6', label: '6 horas' },
    { value: '24', label: '24 horas' },
    { value: '72', label: '3 dias' },
    { value: '168', label: '7 dias' },
  ]

  return (
    <AdminPage>
      <AdminHeader title="Carrinhos Abandonados" subtitle={`${carts.length} carrinhos encontrados`} />

      <AdminFilter>
        <AdminSelect
          value={hours}
          onChange={setHours}
          options={hoursOptions}
          placeholder="Abandonados há mais de"
        />
      </AdminFilter>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <AdminCard key={i}>
              <div className="h-24 bg-white/[0.03] animate-pulse rounded-lg" />
            </AdminCard>
          ))}
        </div>
      ) : carts.length === 0 ? (
        <AdminEmptyState
          icon={ShoppingCart}
          title="Nenhum carrinho abandonado"
          description="Bom sinal! Todos os clientes estão finalizando suas compras."
        />
      ) : (
        <div className="space-y-3">
          {carts.map((cart) => (
            <AdminCard key={cart.userId}>
              <div className="flex items-start justify-between gap-4">
                {/* Client info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      cart.recovered ? 'bg-emerald-500/10' : 'bg-amber-500/10'
                    }`}>
                      <ShoppingCart className={`h-5 w-5 ${cart.recovered ? 'text-emerald-400' : 'text-amber-400'}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-white truncate">
                        {cart.name || 'Cliente sem nome'}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-white/30">
                        {cart.email && <span>{cart.email}</span>}
                        {cart.phone && <span>{cart.phone}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="bg-white/[0.03] border border-white/[0.04] rounded-lg p-3 mb-3">
                    <div className="space-y-1.5">
                      {cart.items.map((item) => (
                        <div key={item.productId} className="flex justify-between text-sm">
                          <span className="text-white/50 truncate flex-1 mr-2">
                            {item.quantity}x {item.name}
                          </span>
                          <span className="text-white font-medium flex-shrink-0">
                            R$ {fmt(item.price * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-white/[0.06] mt-2 pt-2 flex justify-between">
                      <span className="text-sm font-semibold text-white/60">Total</span>
                      <span className="font-bold text-white">R$ {fmt(cart.total)}</span>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="flex items-center gap-3 text-xs">
                    {cart.recovered ? (
                      <AdminBadge label="Recuperado — pedido finalizado" variant="success" />
                    ) : (
                      <>
                        <span className="flex items-center gap-1 text-amber-400">
                          <Clock className="h-3.5 w-3.5" />
                          {getTimeAgo(cart.lastUpdate)}
                        </span>
                        {cart.notifications.whatsapp && (
                          <span className="flex items-center gap-1 text-emerald-400">
                            <CheckCircle className="h-3.5 w-3.5" />
                            WhatsApp
                          </span>
                        )}
                        {cart.notifications.email && (
                          <span className="flex items-center gap-1 text-blue-400">
                            <CheckCircle className="h-3.5 w-3.5" />
                            Email
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleRecover(cart.userId, 'whatsapp')}
                    disabled={sendingId === `${cart.userId}-whatsapp` || !cart.phone || cart.recovered}
                    className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium rounded-lg hover:bg-emerald-500/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    <MessageCircle className="h-4 w-4" />
                    {sendingId === `${cart.userId}-whatsapp` ? '...' : 'WhatsApp'}
                  </button>
                  <button
                    onClick={() => handleRecover(cart.userId, 'email')}
                    disabled={sendingId === `${cart.userId}-email` || !cart.email || cart.recovered}
                    className="flex items-center gap-2 px-4 py-2.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium rounded-lg hover:bg-blue-500/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    <Mail className="h-4 w-4" />
                    {sendingId === `${cart.userId}-email` ? '...' : 'Email'}
                  </button>
                </div>
              </div>
            </AdminCard>
          ))}
        </div>
      )}
    </AdminPage>
  )
}

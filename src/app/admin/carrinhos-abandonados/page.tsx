'use client'

import { useState, useEffect, useCallback } from 'react'
import { ShoppingCart, MessageCircle, Mail, Clock, AlertCircle, CheckCircle } from 'lucide-react'
import { fmt } from '@/lib/products'

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
}

export default function AbandonedCartsPage() {
  const [carts, setCarts] = useState<AbandonedCart[]>([])
  const [loading, setLoading] = useState(true)
  const [hours, setHours] = useState(2)
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

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900">Carrinhos Abandonados</h1>
          <p className="text-zinc-500 mt-1">{carts.length} carrinhos encontrados</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-zinc-600">Abandonados há mais de:</span>
          <select
            value={hours}
            onChange={(e) => setHours(parseInt(e.target.value))}
            className="border border-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-300 cursor-pointer"
          >
            <option value={2}>2 horas</option>
            <option value={6}>6 horas</option>
            <option value={24}>24 horas</option>
            <option value={72}>3 dias</option>
            <option value={168}>7 dias</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-zinc-200 p-6">
              <div className="h-20 bg-zinc-100 animate-pulse rounded" />
            </div>
          ))}
        </div>
      ) : carts.length === 0 ? (
        <div className="bg-white rounded-xl border border-zinc-200 p-12 text-center">
          <ShoppingCart className="h-12 w-12 text-zinc-300 mx-auto mb-4" />
          <p className="text-zinc-500">Nenhum carrinho abandonado encontrado</p>
          <p className="text-zinc-400 text-sm mt-1">Bom sinal! Todos os clientes estão finalizando suas compras.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {carts.map((cart) => (
            <div key={cart.userId} className="bg-white rounded-xl border border-zinc-200 p-6">
              <div className="flex items-start justify-between gap-4">
                {/* Client info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <ShoppingCart className="h-5 w-5 text-red-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-zinc-900 truncate">
                        {cart.name || 'Cliente sem nome'}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-zinc-500">
                        {cart.email && <span>{cart.email}</span>}
                        {cart.phone && <span>{cart.phone}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="bg-zinc-50 rounded-lg p-3 mb-3">
                    <div className="space-y-1.5">
                      {cart.items.map((item) => (
                        <div key={item.productId} className="flex justify-between text-sm">
                          <span className="text-zinc-700 truncate flex-1 mr-2">
                            {item.quantity}x {item.name}
                          </span>
                          <span className="text-zinc-900 font-medium flex-shrink-0">
                            R$ {fmt(item.price * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-zinc-200 mt-2 pt-2 flex justify-between">
                      <span className="text-sm font-semibold text-zinc-900">Total</span>
                      <span className="font-bold text-zinc-900">R$ {fmt(cart.total)}</span>
                    </div>
                  </div>

                  {/* Time + notification status */}
                  <div className="flex items-center gap-4 text-xs">
                    <span className="flex items-center gap-1 text-amber-600">
                      <Clock className="h-3.5 w-3.5" />
                      {getTimeAgo(cart.lastUpdate)}
                    </span>
                    {cart.notifications.whatsapp && (
                      <span className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="h-3.5 w-3.5" />
                        WhatsApp enviado
                      </span>
                    )}
                    {cart.notifications.email && (
                      <span className="flex items-center gap-1 text-blue-600">
                        <CheckCircle className="h-3.5 w-3.5" />
                        Email enviado
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleRecover(cart.userId, 'whatsapp')}
                    disabled={sendingId === `${cart.userId}-whatsapp` || !cart.phone}
                    className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    <MessageCircle className="h-4 w-4" />
                    {sendingId === `${cart.userId}-whatsapp` ? 'Abrindo...' : 'WhatsApp'}
                  </button>
                  <button
                    onClick={() => handleRecover(cart.userId, 'email')}
                    disabled={sendingId === `${cart.userId}-email` || !cart.email}
                    className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    <Mail className="h-4 w-4" />
                    {sendingId === `${cart.userId}-email` ? 'Enviando...' : 'Email'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

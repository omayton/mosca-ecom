'use client'

import { useState, useEffect, useCallback } from 'react'
import { ShoppingCart, MessageCircle, Mail, Clock, CheckCircle, ChevronDown, ChevronUp, Eye, RefreshCw } from 'lucide-react'
import { fmt } from '@/lib/products'
import {
  AdminPage, AdminHeader, AdminSelect, AdminFilter,
  AdminEmptyState, AdminBadge, AdminCard
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

function getTimeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(mins / 60)
  const days  = Math.floor(hours / 24)
  if (days > 0)  return `${days}d ${hours % 24}h atrás`
  if (hours > 0) return `${hours}h ${mins % 60}min atrás`
  return `${mins}min atrás`
}

function buildWhatsappMessage(cart: AbandonedCart, coupon: string) {
  const name = cart.name || 'Cliente'
  const items = cart.items.map(i => `  • ${i.quantity}x ${i.name} — R$ ${fmt(i.price * i.quantity)}`).join('\n')
  let msg = `Olá ${name}! 👋\n\n`
  msg += `Notamos que você deixou alguns itens no carrinho da Mosca Branca Parts:\n\n`
  msg += `${items}\n\n`
  msg += `💰 Total: R$ ${fmt(cart.total)}\n\n`
  if (coupon) msg += `🎁 Use o cupom *${coupon.toUpperCase()}* para um desconto especial!\n\n`
  msg += `👉 Finalize sua compra:\nhttps://www.moscabrancaparts.com.br/checkout\n\n`
  msg += `Alguma dúvida? Responda esta mensagem, estamos aqui! 🚗`
  return msg
}

function CartCard({ cart, onActionDone }: { cart: AbandonedCart; onActionDone: () => void }) {
  const [expanded,  setExpanded]  = useState(false)
  const [coupon,    setCoupon]    = useState('')
  const [preview,   setPreview]   = useState(false)
  const [sending,   setSending]   = useState<'whatsapp' | 'email' | null>(null)
  const [sent,      setSent]      = useState<{ whatsapp?: boolean; email?: boolean }>({})

  const waMsg = buildWhatsappMessage(cart, coupon)

  async function send(channel: 'whatsapp' | 'email') {
    setSending(channel)
    try {
      const res = await fetch('/api/admin/abandoned-carts/recover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: cart.userId, channel, couponCode: coupon || undefined }),
      })
      const data = await res.json()

      if (channel === 'whatsapp' && data.whatsappUrl) {
        window.open(data.whatsappUrl, '_blank')
        setSent(s => ({ ...s, whatsapp: true }))
      } else if (channel === 'email' && res.ok) {
        setSent(s => ({ ...s, email: true }))
        alert('✅ Email enviado com sucesso!')
      } else {
        alert(data.error || 'Erro ao enviar')
      }
      onActionDone()
    } finally {
      setSending(null)
    }
  }

  const alreadySentWA    = !!cart.notifications.whatsapp
  const alreadySentEmail = !!cart.notifications.email
  const hasPhone = !!cart.phone
  const hasEmail = !!cart.email

  return (
    <AdminCard>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
            cart.recovered ? 'bg-emerald-500/10' : 'bg-amber-500/10'
          }`}>
            <ShoppingCart className={`h-5 w-5 ${cart.recovered ? 'text-emerald-400' : 'text-amber-400'}`} />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-white truncate">
              {cart.name || <span className="text-white/40 italic text-sm">sem nome</span>}
            </p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-white/40 mt-0.5">
              {cart.email && <span>{cart.email}</span>}
              {cart.phone && <span>{cart.phone}</span>}
              <span className="flex items-center gap-1 text-amber-400/80">
                <Clock className="h-3 w-3" />
                {getTimeAgo(cart.lastUpdate)}
              </span>
            </div>
          </div>
        </div>

        {/* Total + expand */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-right">
            <p className="font-bold text-white text-lg">R$ {fmt(cart.total)}</p>
            <p className="text-white/30 text-xs">{cart.items.length} item{cart.items.length !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={() => setExpanded(e => !e)}
            className="w-8 h-8 flex items-center justify-center text-white/30 hover:text-white/70 transition-colors cursor-pointer"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Status badges */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {cart.recovered && <AdminBadge label="Recuperado — pedido finalizado" variant="success" />}
        {(alreadySentWA || sent.whatsapp) && (
          <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
            <CheckCircle className="h-3 w-3" /> WhatsApp enviado
          </span>
        )}
        {(alreadySentEmail || sent.email) && (
          <span className="flex items-center gap-1 text-xs text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full">
            <CheckCircle className="h-3 w-3" /> Email enviado
          </span>
        )}
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="space-y-4 pt-3 border-t border-white/[0.06]">
          {/* Items */}
          <div>
            <p className="text-xs text-white/30 uppercase tracking-widest mb-2">Itens no carrinho</p>
            <div className="bg-white/[0.03] border border-white/[0.04] rounded-lg divide-y divide-white/[0.04]">
              {cart.items.map(item => (
                <div key={item.productId} className="flex justify-between items-center px-3 py-2 text-sm">
                  <span className="text-white/60 truncate flex-1 mr-3">
                    <span className="text-white font-medium mr-1">{item.quantity}x</span>
                    {item.name}
                  </span>
                  <span className="text-white font-semibold flex-shrink-0">R$ {fmt(item.price * item.quantity)}</span>
                </div>
              ))}
              <div className="flex justify-between px-3 py-2 font-bold text-sm">
                <span className="text-white/50">Total</span>
                <span className="text-amber-400">R$ {fmt(cart.total)}</span>
              </div>
            </div>
          </div>

          {/* Coupon */}
          <div>
            <p className="text-xs text-white/30 uppercase tracking-widest mb-2">Cupom de desconto (opcional)</p>
            <input
              type="text"
              value={coupon}
              onChange={e => setCoupon(e.target.value.toUpperCase())}
              placeholder="Ex: VOLTA10"
              className="w-full bg-white/[0.04] border border-white/[0.08] text-white placeholder:text-white/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500/50 font-mono tracking-widest uppercase"
            />
          </div>

          {/* Message preview */}
          <div>
            <button
              onClick={() => setPreview(p => !p)}
              className="flex items-center gap-2 text-xs text-white/40 hover:text-white/70 transition-colors cursor-pointer mb-2"
            >
              <Eye className="h-3.5 w-3.5" />
              {preview ? 'Ocultar' : 'Ver'} prévia da mensagem WhatsApp
            </button>
            {preview && (
              <div className="bg-[#075E54]/10 border border-[#128C7E]/30 rounded-lg p-3">
                <pre className="text-xs text-white/70 whitespace-pre-wrap font-sans leading-relaxed">
                  {waMsg}
                </pre>
              </div>
            )}
          </div>

          {/* Action buttons */}
          {!cart.recovered && (
            <div className="flex gap-3">
              <button
                onClick={() => send('whatsapp')}
                disabled={sending === 'whatsapp' || !hasPhone}
                title={!hasPhone ? 'Cliente sem telefone cadastrado' : undefined}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-semibold rounded-lg hover:bg-emerald-500/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <MessageCircle className="h-4 w-4" />
                {sending === 'whatsapp' ? 'Abrindo...' : 'Enviar WhatsApp'}
              </button>
              <button
                onClick={() => send('email')}
                disabled={sending === 'email' || !hasEmail}
                title={!hasEmail ? 'Cliente sem email cadastrado' : undefined}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-semibold rounded-lg hover:bg-blue-500/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <Mail className="h-4 w-4" />
                {sending === 'email' ? 'Enviando...' : 'Enviar Email'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Quick actions when collapsed */}
      {!expanded && !cart.recovered && (
        <div className="flex gap-2">
          <button
            onClick={() => send('whatsapp')}
            disabled={sending === 'whatsapp' || !hasPhone}
            title={!hasPhone ? 'Cliente sem telefone' : undefined}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium rounded-lg hover:bg-emerald-500/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            WhatsApp
          </button>
          <button
            onClick={() => send('email')}
            disabled={sending === 'email' || !hasEmail}
            title={!hasEmail ? 'Sem email' : undefined}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium rounded-lg hover:bg-blue-500/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <Mail className="h-3.5 w-3.5" />
            Email
          </button>
          <button
            onClick={() => setExpanded(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.04] border border-white/[0.08] text-white/40 text-xs font-medium rounded-lg hover:bg-white/[0.08] hover:text-white/70 transition-colors cursor-pointer"
          >
            + Cupom
          </button>
        </div>
      )}
    </AdminCard>
  )
}

export default function AbandonedCartsPage() {
  const [carts,   setCarts]   = useState<AbandonedCart[]>([])
  const [loading, setLoading] = useState(true)
  const [hours,   setHours]   = useState('2')

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

  const active    = carts.filter(c => !c.recovered)
  const recovered = carts.filter(c => c.recovered)

  const hoursOptions = [
    { value: '2',   label: 'mais de 2 horas' },
    { value: '6',   label: 'mais de 6 horas' },
    { value: '24',  label: 'mais de 24 horas' },
    { value: '72',  label: 'mais de 3 dias' },
    { value: '168', label: 'mais de 7 dias' },
  ]

  return (
    <AdminPage>
      <AdminHeader
        title="Carrinhos Abandonados"
        subtitle={loading ? 'Carregando...' : `${active.length} para recuperar · ${recovered.length} recuperados`}
      />

      <AdminFilter>
        <AdminSelect
          value={hours}
          onChange={setHours}
          options={hoursOptions}
          placeholder="Abandonados há"
        />
        <button
          onClick={fetchCarts}
          className="flex items-center gap-2 px-4 py-2 bg-white/[0.04] border border-white/[0.08] text-white/60 hover:text-white text-sm rounded-lg transition-colors cursor-pointer"
        >
          <RefreshCw className="h-4 w-4" />
          Atualizar
        </button>
      </AdminFilter>

      {/* Info box */}
      <div className="mx-6 mb-6 p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
        <p className="text-amber-400/90 text-sm font-medium mb-1">Como funciona a recuperação</p>
        <p className="text-white/40 text-xs leading-relaxed">
          <strong className="text-emerald-400">WhatsApp</strong> — abre o WhatsApp no seu celular com a mensagem pré-preenchida. Você revisa e envia manualmente.<br />
          <strong className="text-blue-400">Email</strong> — envia automaticamente pelo Resend para o email do cliente.<br />
          Opcionalmente adicione um <strong className="text-white/60">cupom de desconto</strong> expandindo o card para aumentar a conversão.
        </p>
      </div>

      {loading ? (
        <div className="space-y-3 px-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 bg-white/[0.02] animate-pulse rounded-xl" />
          ))}
        </div>
      ) : carts.length === 0 ? (
        <AdminEmptyState
          icon={ShoppingCart}
          title="Nenhum carrinho abandonado"
          description={`Nenhum carrinho inativo há mais de ${hours}h. Tente aumentar o período de busca.`}
        />
      ) : (
        <div className="space-y-3">
          {/* Active */}
          {active.length > 0 && (
            <>
              <div className="px-6 pt-2">
                <p className="text-xs text-white/30 uppercase tracking-widest font-semibold">
                  Para recuperar ({active.length})
                </p>
              </div>
              {active.map(cart => (
                <CartCard key={cart.userId} cart={cart} onActionDone={fetchCarts} />
              ))}
            </>
          )}

          {/* Recovered */}
          {recovered.length > 0 && (
            <>
              <div className="px-6 pt-4">
                <p className="text-xs text-emerald-400/60 uppercase tracking-widest font-semibold">
                  Recuperados ({recovered.length})
                </p>
              </div>
              {recovered.map(cart => (
                <CartCard key={cart.userId} cart={cart} onActionDone={fetchCarts} />
              ))}
            </>
          )}
        </div>
      )}
    </AdminPage>
  )
}

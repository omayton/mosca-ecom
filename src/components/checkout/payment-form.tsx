"use client"

import { useState, useEffect, useRef } from "react"
import Script from "next/script"
import { Loader2, CreditCard, QrCode, Copy, CheckCircle2, XCircle, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { fmt } from "@/lib/products"
import Image from "next/image"

type PaymentTab = "credit_card" | "pix"

interface PaymentFormProps {
  orderId: number
  total: number
  onSuccess: () => void
}

export function PaymentForm({ orderId, total, onSuccess }: PaymentFormProps) {
  const [tab, setTab] = useState<PaymentTab>("credit_card")
  const [mpReady, setMpReady] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [pixData, setPixData] = useState<{ qr_code: string; qr_code_base64: string } | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [pixCountdown, setPixCountdown] = useState(0)

  // Card form state
  const [cardNumber, setCardNumber] = useState("")
  const [cardExpiry, setCardExpiry] = useState("")
  const [cardCvv, setCardCvv] = useState("")
  const [cardHolder, setCardHolder] = useState("")
  const [installments, setInstallments] = useState(1)
  const [cardBrand, setCardBrand] = useState("")

  const mpRef = useRef<any>(null)

  function handleMpLoad() {
    const publicKey = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY
    if (publicKey && (window as any).MercadoPago) {
      mpRef.current = new (window as any).MercadoPago(publicKey)
      setMpReady(true)
    }
  }

  async function handleCardSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!mpRef.current) return

    setLoading(true)
    setError("")
    setPaymentStatus(null)

    try {
      const [expMonth, expYear] = cardExpiry.split("/")

      const cardData = {
        cardNumber: cardNumber.replace(/\s/g, ""),
        cardholderName: cardHolder,
        cardExpirationMonth: expMonth,
        cardExpirationYear: expYear.length === 2 ? `20${expYear}` : expYear,
        securityCode: cardCvv,
      }

      const tokenResult = await mpRef.current.createCardToken(cardData)

      if (tokenResult.error) {
        setError("Erro ao processar cartão. Verifique os dados.")
        setLoading(false)
        return
      }

      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          paymentMethod: "credit_card",
          token: tokenResult.id,
          installments,
          paymentMethodId: cardBrand || "visa",
          issuerId: "",
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Erro ao processar pagamento")
        setLoading(false)
        return
      }

      setPaymentStatus(data.status)

      if (data.status === "approved") {
        setTimeout(onSuccess, 1500)
      }
    } catch {
      setError("Erro de conexão. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  async function handlePixGenerate() {
    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, paymentMethod: "pix" }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Erro ao gerar PIX")
        setLoading(false)
        return
      }

      setPixData({ qr_code: data.qr_code, qr_code_base64: data.qr_code_base64 })
      setPixCountdown(15 * 60) // 15 minutes
      setPaymentStatus(data.status)
    } catch {
      setError("Erro de conexão. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  // PIX countdown timer
  useEffect(() => {
    if (pixCountdown <= 0) return
    const interval = setInterval(() => {
      setPixCountdown((prev) => {
        if (prev <= 1) { clearInterval(interval); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [pixCountdown > 0])

  function handleCopyPix() {
    if (pixData?.qr_code) {
      navigator.clipboard.writeText(pixData.qr_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  function formatCardNumber(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 16)
    const formatted = digits.replace(/(\d{4})(?=\d)/g, "$1 ")
    setCardNumber(formatted)

    // Detect brand
    if (digits.startsWith("4")) setCardBrand("visa")
    else if (digits.startsWith("5")) setCardBrand("master")
    else if (digits.startsWith("3")) setCardBrand("amex")
    else if (digits.startsWith("6")) setCardBrand("elo")
    else setCardBrand("")
  }

  function formatExpiry(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 4)
    if (digits.length > 2) setCardExpiry(`${digits.slice(0, 2)}/${digits.slice(2)}`)
    else setCardExpiry(digits)
  }

  if (paymentStatus === "approved") {
    return (
      <div className="text-center py-8">
        <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
        <h3 className="font-bold text-xl text-green-800">Pagamento aprovado!</h3>
        <p className="text-sm text-green-700 mt-2">Redirecionando...</p>
      </div>
    )
  }

  if (paymentStatus === "rejected") {
    return (
      <div className="text-center py-8 space-y-4">
        <XCircle className="h-12 w-12 text-red-600 mx-auto" />
        <h3 className="font-bold text-xl text-red-800">Pagamento recusado</h3>
        <p className="text-sm text-red-700">Verifique os dados do cartão ou tente outro método.</p>
        <button
          onClick={() => { setPaymentStatus(null); setError("") }}
          className="text-sm text-red-600 hover:text-red-700 font-semibold cursor-pointer"
        >
          Tentar novamente
        </button>
      </div>
    )
  }

  const inputClass = "w-full px-4 py-3 border border-zinc-200 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all rounded-lg"

  return (
    <div className="space-y-6">
      <Script
        src="https://sdk.mercadopago.com/js/v2"
        onLoad={handleMpLoad}
      />

      {/* Tabs */}
      <div className="flex border border-zinc-200 rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setTab("credit_card")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-medium transition-colors cursor-pointer",
            tab === "credit_card" ? "bg-red-600 text-white" : "bg-white text-zinc-600 hover:bg-zinc-50"
          )}
        >
          <CreditCard className="h-4 w-4" />
          Cartão
        </button>
        <button
          type="button"
          onClick={() => setTab("pix")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-medium transition-colors cursor-pointer",
            tab === "pix" ? "bg-red-600 text-white" : "bg-white text-zinc-600 hover:bg-zinc-50"
          )}
        >
          <QrCode className="h-4 w-4" />
          PIX
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Card form */}
      {tab === "credit_card" && (
        <form onSubmit={handleCardSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">
              Número do cartão
            </label>
            <input
              type="text"
              required
              value={cardNumber}
              onChange={(e) => formatCardNumber(e.target.value)}
              className={inputClass}
              placeholder="0000 0000 0000 0000"
              autoComplete="cc-number"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                Validade
              </label>
              <input
                type="text"
                required
                value={cardExpiry}
                onChange={(e) => formatExpiry(e.target.value)}
                className={inputClass}
                placeholder="MM/AA"
                autoComplete="cc-exp"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                CVV
              </label>
              <input
                type="text"
                required
                value={cardCvv}
                onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                className={inputClass}
                placeholder="123"
                autoComplete="cc-csc"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">
              Nome no cartão
            </label>
            <input
              type="text"
              required
              value={cardHolder}
              onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
              className={inputClass}
              placeholder="NOME COMO NO CARTÃO"
              autoComplete="cc-name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">
              Parcelas
            </label>
            <select
              value={installments}
              onChange={(e) => setInstallments(Number(e.target.value))}
              className={cn(inputClass, "cursor-pointer")}
            >
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>
                  {n}x de R$ {fmt(total / n)} {n === 1 ? "(à vista)" : "sem juros"}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={loading || !mpReady}
            className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold text-sm px-6 py-3.5 min-h-[48px] transition-colors duration-200 cursor-pointer rounded-xl"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "Processando..." : `Pagar R$ ${fmt(total)}`}
          </button>
        </form>
      )}

      {/* PIX */}
      {tab === "pix" && (
        <div className="space-y-4">
          {!pixData ? (
            <div className="text-center space-y-4">
              <div className="bg-green-50 rounded-xl p-6">
                <p className="font-bold text-2xl text-green-700">
                  R$ {fmt(total * 0.95)}
                </p>
                <p className="text-sm text-green-600 mt-1">
                  5% de desconto no PIX (economia de R$ {fmt(total * 0.05)})
                </p>
              </div>
              <button
                type="button"
                onClick={handlePixGenerate}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold text-sm px-6 py-3.5 min-h-[48px] transition-colors duration-200 cursor-pointer rounded-xl"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? "Gerando PIX..." : "Gerar QR Code PIX"}
              </button>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <p className="text-sm text-zinc-700 font-medium">
                Escaneie o QR Code ou copie o código:
              </p>

              {/* Countdown timer */}
              {pixCountdown > 0 && (
                <div className={`flex items-center justify-center gap-2 py-2 px-4 rounded-lg mx-auto w-fit ${
                  pixCountdown <= 120 ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
                }`}>
                  <Clock className="h-4 w-4" aria-hidden="true" />
                  <span className="text-sm font-bold tabular-nums">
                    {String(Math.floor(pixCountdown / 60)).padStart(2, '0')}:{String(pixCountdown % 60).padStart(2, '0')}
                  </span>
                  <span className="text-xs font-medium">para pagar</span>
                </div>
              )}
              {pixCountdown === 0 && pixData && (
                <div className="flex items-center justify-center gap-2 py-2 px-4 bg-red-50 text-red-700 rounded-lg mx-auto w-fit">
                  <XCircle className="h-4 w-4" aria-hidden="true" />
                  <span className="text-sm font-bold">QR Code expirado — gere um novo</span>
                </div>
              )}

              {pixData.qr_code_base64 && (
                <div className="flex justify-center">
                  <img
                    src={`data:image/png;base64,${pixData.qr_code_base64}`}
                    alt="QR Code PIX"
                    className="w-48 h-48 rounded-lg border border-zinc-200"
                  />
                </div>
              )}

              <div className="relative">
                <input
                  type="text"
                  readOnly
                  value={pixData.qr_code}
                  className="w-full px-4 py-3 pr-12 border border-zinc-200 text-xs text-zinc-600 rounded-lg bg-zinc-50 truncate"
                />
                <button
                  type="button"
                  onClick={handleCopyPix}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-zinc-500 hover:text-zinc-700 cursor-pointer"
                  title="Copiar código PIX"
                >
                  {copied ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>

              {copied && (
                <p className="text-xs text-green-600">Código copiado!</p>
              )}

              <p className="text-xs text-zinc-500">
                Após o pagamento, o pedido será confirmado automaticamente.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

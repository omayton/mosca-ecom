"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useCart } from "@/contexts/cart-context"
import { CheckoutSteps, type CheckoutStep } from "@/components/checkout/checkout-steps"
import { AddressForm, type AddressData } from "@/components/checkout/address-form"
import { ShippingSelector, type ShippingOption } from "@/components/checkout/shipping-selector"
import { OrderSummary } from "@/components/checkout/order-summary"
import { PaymentForm } from "@/components/checkout/payment-form"
import { ArrowLeft } from "lucide-react"

export default function CheckoutPage() {
  const router = useRouter()
  const { items, clearCart } = useCart()
  const [step, setStep] = useState<CheckoutStep>("address")
  const [address, setAddress] = useState<AddressData | null>(null)
  const [saveAddress, setSaveAddress] = useState(true)
  const [shipping, setShipping] = useState<ShippingOption | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [profile, setProfile] = useState<{ address_json?: any; phone?: string } | null>(null)
  const [orderId, setOrderId] = useState<number | null>(null)
  const [orderTotal, setOrderTotal] = useState<number>(0)

  useEffect(() => {
    fetch("/api/profile")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => { if (data) setProfile(data) })
      .catch(() => {})
  }, [])

  if (items.length === 0 && !loading && !orderId) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="font-inter text-zinc-600">Seu carrinho está vazio.</p>
          <button
            onClick={() => router.push("/")}
            className="font-inter text-sm text-red-600 hover:text-red-700 font-semibold cursor-pointer"
          >
            Voltar às compras
          </button>
        </div>
      </div>
    )
  }

  function handleAddressSubmit(data: AddressData, save: boolean) {
    setAddress(data)
    setSaveAddress(save)
    setStep("shipping")
  }

  function handleShippingSelect(option: ShippingOption) {
    setShipping(option)
  }

  async function handleProceedToPayment() {
    if (!address || !shipping) return

    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
          })),
          address,
          shipping: {
            id: shipping.id,
            name: shipping.name,
            company: shipping.company,
            price: shipping.price,
            delivery_time: shipping.delivery_time,
          },
          cpf: address.cpf,
          saveAddress,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Erro ao criar pedido")
        setLoading(false)
        return
      }

      setOrderId(data.orderId)
      setOrderTotal(data.total)
      setStep("review")
    } catch {
      setError("Erro de conexão. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  function handlePaymentSuccess() {
    clearCart()
    router.push(`/pedido/${orderId}?status=approved`)
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 font-inter text-sm text-zinc-500 hover:text-zinc-700 mb-6 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </button>

        <h1 className="font-barlow font-bold text-2xl text-zinc-900 mb-6">Finalizar Compra</h1>

        <div className="mb-8">
          <CheckoutSteps current={step} />
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 font-inter text-sm px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="bg-white border border-zinc-100 rounded-xl p-6 shadow-sm">
          {step === "address" && (
            <AddressForm
              initialAddress={profile?.address_json}
              initialPhone={profile?.phone}
              onSubmit={handleAddressSubmit}
            />
          )}

          {step === "shipping" && address && (
            <div className="space-y-6">
              <ShippingSelector
                cep={address.cep}
                items={items}
                onSelect={handleShippingSelect}
              />
              {shipping && (
                <button
                  onClick={handleProceedToPayment}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-inter font-semibold text-sm px-6 py-3.5 min-h-[48px] transition-colors duration-200 cursor-pointer rounded-xl"
                >
                  {loading ? "Criando pedido..." : "Continuar para pagamento"}
                </button>
              )}
              <button
                onClick={() => setStep("address")}
                className="w-full font-inter text-sm text-zinc-500 hover:text-zinc-700 cursor-pointer"
              >
                Voltar para endereço
              </button>
            </div>
          )}

          {step === "review" && orderId && (
            <div className="space-y-6">
              <OrderSummary items={items} shipping={shipping} />
              <PaymentForm
                orderId={orderId}
                total={orderTotal}
                onSuccess={handlePaymentSuccess}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

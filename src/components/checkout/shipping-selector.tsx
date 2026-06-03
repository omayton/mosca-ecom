"use client"

import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { CartItem } from "@/contexts/cart-context"
import { parseWeight, parseDimensions } from "@/lib/products"

export interface ShippingOption {
  id: number
  name: string
  company: string
  price: number
  delivery_time: number
}

interface ShippingSelectorProps {
  cep: string
  items: CartItem[]
  onSelect: (option: ShippingOption) => void
}

function aggregatePackage(items: CartItem[]) {
  let totalWeight = 0
  let maxWidth = 16
  let maxHeight = 10
  let maxLength = 10
  let totalPrice = 0

  for (const item of items) {
    const w = parseWeight(undefined)
    totalWeight += w * item.quantity
    totalPrice += item.price * item.quantity
  }

  if (totalWeight < 0.01) totalWeight = 0.3

  return { weight: totalWeight, width: maxWidth, height: maxHeight, length: maxLength, price: totalPrice }
}

export function ShippingSelector({ cep, items, onSelect }: ShippingSelectorProps) {
  const [options, setOptions] = useState<ShippingOption[]>([])
  const [selected, setSelected] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const cleanCep = cep.replace(/\D/g, "")
    if (cleanCep.length !== 8 || items.length === 0) return

    setLoading(true)
    setError("")
    setOptions([])
    setSelected(null)

    const pkg = aggregatePackage(items)

    fetch("/api/shipping/calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cep: cleanCep, ...pkg }),
    })
      .then(async (res) => {
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Erro ao calcular frete")
        setOptions(data)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [cep, items])

  function handleSelect(option: ShippingOption) {
    setSelected(option.id)
    onSelect(option)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-8 text-zinc-500">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm">Calculando opções de frete...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg">
        {error}
      </div>
    )
  }

  if (options.length === 0) return null

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-zinc-700">Selecione o frete:</p>
      <div className="space-y-2">
        {options.map((option) => (
          <label
            key={option.id}
            className={cn(
              "flex items-center gap-4 p-4 border rounded-xl cursor-pointer transition-all duration-200",
              selected === option.id
                ? "border-red-500 bg-red-50/50 shadow-sm"
                : "border-zinc-200 hover:border-zinc-300 hover:shadow-sm"
            )}
          >
            <input
              type="radio"
              name="shipping"
              checked={selected === option.id}
              onChange={() => handleSelect(option)}
              className="w-4 h-4 text-red-600 border-zinc-300 focus:ring-red-500 cursor-pointer"
            />
            <CarrierLogo company={option.company} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-900">
                {option.company} — {option.name}
              </p>
              <p className="text-xs text-zinc-500">
                Entrega em até {option.delivery_time} dias úteis
              </p>
            </div>
            <span className="font-bold text-zinc-900">
              R$ {option.price.toFixed(2).replace(".", ",")}
            </span>
          </label>
        ))}
      </div>
    </div>
  )
}

function CarrierLogo({ company }: { company: string }) {
  const name = (company || "").toLowerCase()

  if (name.includes("correios")) {
    return (
      <div className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center bg-[#FFDE00] ring-1 ring-[#FFDE00]/30">
        <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
          <path d="M2 8l10-4 10 4v2L12 14 2 10V8z" fill="#004B93" />
          <path d="M2 12l10 4 10-4v2l-10 4-10-4v-2z" fill="#004B93" />
          <path d="M2 16l10 4 10-4v2l-10 4-10-4v-2z" fill="#004B93" />
        </svg>
      </div>
    )
  }

  if (name.includes("jadlog")) {
    return (
      <div className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center bg-[#ED1C24] ring-1 ring-[#ED1C24]/30">
        <span className="text-[10px] font-black text-white leading-none">JL</span>
      </div>
    )
  }

  if (name.includes("azul") || name.includes("azul cargo")) {
    return (
      <div className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center bg-[#003B7A] ring-1 ring-[#003B7A]/30">
        <span className="text-[10px] font-black text-white leading-none">AC</span>
      </div>
    )
  }

  if (name.includes("latam")) {
    return (
      <div className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center bg-[#1B0088] ring-1 ring-[#1B0088]/30">
        <span className="text-[10px] font-black text-white leading-none">LT</span>
      </div>
    )
  }

  return (
    <div className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center bg-zinc-100 text-zinc-600 ring-1 ring-zinc-200">
      <span className="text-[10px] font-bold uppercase leading-none">
        {company?.slice(0, 2) || "??"}
      </span>
    </div>
  )
}

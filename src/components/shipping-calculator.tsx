"use client"

import { useState } from "react"
import { Truck, Loader2 } from "lucide-react"

interface ShippingOption {
  id: number
  name: string
  company: string
  price: number
  delivery_time: number
}

interface Props {
  weight: number
  width: number
  height: number
  length: number
}

export function ShippingCalculator({ weight, width, height, length }: Props) {
  const [cep, setCep] = useState("")
  const [loading, setLoading] = useState(false)
  const [options, setOptions] = useState<ShippingOption[]>([])
  const [error, setError] = useState("")

  function formatCep(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 8)
    if (digits.length > 5) return digits.slice(0, 5) + "-" + digits.slice(5)
    return digits
  }

  async function calculate() {
    const digits = cep.replace(/\D/g, "")
    if (digits.length !== 8) {
      setError("Digite um CEP válido com 8 dígitos")
      return
    }

    setLoading(true)
    setError("")
    setOptions([])

    try {
      const res = await fetch("/api/shipping/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cep: digits, weight, width, height, length }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        console.error("Shipping calc error:", data)
        setError(data?.error || "Erro ao calcular frete")
        return
      }

      const data: ShippingOption[] = await res.json()
      if (data.length === 0) {
        setError("Nenhuma opção de envio disponível para este CEP")
        return
      }
      setOptions(data)
    } catch {
      setError("Erro de conexão. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-5 pt-5 border-t border-zinc-100">
      <h3 className="font-inter font-semibold text-zinc-900 text-sm mb-3 flex items-center gap-2">
        <Truck className="h-4 w-4 text-red-500" aria-hidden="true" />
        Calcular frete
      </h3>

      <div className="flex gap-2">
        <input
          type="text"
          inputMode="numeric"
          placeholder="00000-000"
          value={cep}
          onChange={(e) => setCep(formatCep(e.target.value))}
          onKeyDown={(e) => e.key === "Enter" && calculate()}
          className="flex-1 border border-zinc-300 px-3 py-2.5 text-sm font-inter text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-red-500 transition-colors"
          aria-label="CEP de destino"
        />
        <button
          onClick={calculate}
          disabled={loading}
          className="bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-400 text-white font-inter font-semibold text-sm px-5 py-2.5 min-h-[44px] transition-colors duration-200 flex items-center gap-2"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
          {loading ? "Calculando..." : "Calcular"}
        </button>
      </div>

      {error && (
        <p className="mt-3 font-inter text-sm text-red-600">{error}</p>
      )}

      {options.length > 0 && (
        <ul className="mt-3 space-y-2">
          {options.map((opt) => (
            <li key={opt.id} className="flex items-center justify-between bg-zinc-50 border border-zinc-200 px-4 py-3">
              <div>
                <p className="font-inter text-sm font-medium text-zinc-800">
                  {opt.company} — {opt.name}
                </p>
                <p className="font-inter text-xs text-zinc-500">
                  {opt.delivery_time} dias úteis
                </p>
              </div>
              <span className="font-barlow font-bold text-zinc-900 text-base">
                R$ {opt.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

"use client"

import { useState } from "react"
import { Truck, Loader2, MapPin, ChevronDown, ChevronUp, XCircle } from "lucide-react"

interface ShippingOption {
  id: number | string
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
  price?: number
}

export function ShippingCalculator({ weight, width, height, length, price }: Props) {
  const [cep, setCep] = useState("")
  const [loading, setLoading] = useState(false)
  const [options, setOptions] = useState<ShippingOption[]>([])
  const [error, setError] = useState("")
  const [expanded, setExpanded] = useState(false)

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
        body: JSON.stringify({ cep: digits, weight, width, height, length, price }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data?.error || "Erro ao calcular frete")
        return
      }

      if (!Array.isArray(data) || data.length === 0) {
        setError(data?.error || "Nenhuma opção de envio disponível para este CEP")
        return
      }

      setOptions(data)
      setExpanded(true)
    } catch {
      setError("Erro de conexão. Verifique sua internet e tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-6 border-t border-zinc-100 pt-5">
      {/* Header - clickable to expand/collapse */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between group cursor-pointer transition-colors duration-200"
        aria-expanded={expanded}
      >
        <h3 className="font-inter font-semibold text-zinc-900 text-sm flex items-center gap-2">
          <Truck className="h-[18px] w-[18px] text-red-600 transition-transform duration-300 group-hover:scale-110" aria-hidden="true" />
          Calcular frete e prazo de entrega
        </h3>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-zinc-400 transition-colors duration-200 group-hover:text-zinc-600" />
        ) : (
          <ChevronDown className="h-4 w-4 text-zinc-400 transition-colors duration-200 group-hover:text-zinc-600" />
        )}
      </button>

      {/* Collapsible content */}
      {(expanded || options.length > 0 || error || loading) && (
        <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
          {/* CEP input row */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" aria-hidden="true" />
              <input
                type="text"
                inputMode="numeric"
                placeholder="Seu CEP"
                value={cep}
                onChange={(e) => setCep(formatCep(e.target.value))}
                onKeyDown={(e) => e.key === "Enter" && calculate()}
                className="w-full border border-zinc-200 pl-10 pr-3 py-2.5 text-sm font-inter text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/10 transition-all duration-200 rounded-xl min-h-[44px]"
                aria-label="CEP de destino"
              />
            </div>
            <button
              onClick={calculate}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 active:bg-red-800 disabled:bg-zinc-300 disabled:cursor-not-allowed text-white font-inter font-semibold text-sm px-5 min-h-[44px] transition-all duration-200 flex items-center justify-center gap-2 rounded-xl cursor-pointer hover:shadow-sm disabled:shadow-none select-none"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  <span>Calculando...</span>
                </>
              ) : (
                "Calcular"
              )}
            </button>
          </div>

          {/* Error message */}
          {error && (
            <div className="mt-3 flex items-start gap-2 bg-red-50/80 border border-red-200 px-4 py-3 rounded-xl animate-in fade-in slide-in-from-top-1 duration-200">
              <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" aria-hidden="true" />
              <p className="font-inter text-sm text-red-700 leading-snug">{error}</p>
            </div>
          )}

          {/* Shipping results */}
          {options.length > 0 && (
            <ul className="mt-3 space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300" role="list" aria-label="Opções de frete">
              {options.map((opt, index) => (
                <li
                  key={opt.id}
                  className={`flex items-center justify-between px-4 py-3.5 rounded-xl border transition-all duration-200 cursor-default ${
                    index === 0
                      ? "bg-green-50/80 border-green-200"
                      : "bg-white border-zinc-100 hover:border-zinc-200"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Company badge */}
                    <div className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold uppercase tracking-wide ${
                      index === 0
                        ? "bg-green-50 text-green-700 ring-1 ring-green-200"
                        : "bg-zinc-50 text-zinc-600 ring-1 ring-zinc-200"
                    }`}>
                      {opt.company?.slice(0, 2) || "??"}
                    </div>
                    <div className="min-w-0">
                      <p className="font-inter text-sm font-medium text-zinc-800 truncate">
                        {opt.company || opt.name}
                      </p>
                      <p className="font-inter text-xs text-zinc-500 mt-0.5 flex items-center gap-1">
                        <Truck className="h-3 w-3" aria-hidden="true" />
                        {opt.delivery_time > 0
                          ? `${opt.delivery_time} dia${opt.delivery_time > 1 ? "s" : ""} útil${opt.delivery_time > 1 ? "s" : ""}`
                          : "Prazo a confirmar"}
                        {index === 0 && (
                          <span className="inline-flex items-center ml-1.5 bg-green-50 text-green-700 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ring-1 ring-green-200">
                            Melhor opção
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex-shrink-0 ml-3 text-right">
                    <span className="font-barlow font-bold text-base text-zinc-900 block">
                      R$ {opt.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

"use client"

import { useState } from "react"
import { X, MapPin, Loader2 } from "lucide-react"

interface CepData {
  cep: string
  cidade: string
  uf: string
}

interface CepModalProps {
  open: boolean
  onClose: () => void
  onSave: (data: CepData) => void
}

export function CepModal({ open, onClose, onSave }: CepModalProps) {
  const [cep, setCep] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [result, setResult] = useState<CepData | null>(null)

  if (!open) return null

  function formatCep(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 8)
    if (digits.length > 5) return `${digits.slice(0, 5)}-${digits.slice(5)}`
    return digits
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const digits = cep.replace(/\D/g, "")
    if (digits.length !== 8) {
      setError("CEP deve ter 8 dígitos")
      return
    }

    setLoading(true)
    setError("")
    setResult(null)

    try {
      const res = await fetch(`/api/address/cep?cep=${digits}`)
      if (!res.ok) {
        setError("CEP não encontrado")
        return
      }
      const data = await res.json()
      if (data.error) {
        setError("CEP não encontrado")
        return
      }
      setResult({ cep: digits, cidade: data.cidade, uf: data.estado })
    } catch {
      setError("Erro ao consultar CEP")
    } finally {
      setLoading(false)
    }
  }

  function handleConfirm() {
    if (result) {
      onSave(result)
      onClose()
      setCep("")
      setResult(null)
    }
  }

  function handleClose() {
    onClose()
    setCep("")
    setError("")
    setResult(null)
  }

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm" onClick={handleClose} aria-hidden="true" />
      <div className="fixed inset-0 z-[61] flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-sm pointer-events-auto" role="dialog" aria-label="Informar CEP">
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-red-500" aria-hidden="true" />
              <h2 className="font-semibold text-zinc-900 text-base">Informe seu CEP</h2>
            </div>
            <button onClick={handleClose} className="p-1.5 text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer" aria-label="Fechar">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-5">
            {!result ? (
              <form onSubmit={handleSubmit}>
                <p className="text-sm text-zinc-500 mb-4">
                  Digite seu CEP para calcular prazos e valores de entrega.
                </p>
                <input
                  type="text"
                  value={cep}
                  onChange={(e) => { setCep(formatCep(e.target.value)); setError("") }}
                  placeholder="00000-000"
                  className="w-full border border-zinc-200 rounded-lg px-4 py-3 text-base text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-red-300 transition-colors"
                  autoFocus
                  inputMode="numeric"
                />
                {error && <p className="text-red-600 text-xs mt-2">{error}</p>}
                <button
                  type="submit"
                  disabled={loading || cep.replace(/\D/g, "").length !== 8}
                  className="w-full mt-4 bg-red-600 hover:bg-red-700 disabled:bg-zinc-300 text-white font-semibold text-sm py-3 rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Consultando...</> : "Buscar CEP"}
                </button>
              </form>
            ) : (
              <div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <p className="font-semibold text-green-800 text-sm">{result.cidade} — {result.uf}</p>
                  <p className="text-green-700 text-xs mt-1">CEP: {formatCep(result.cep)}</p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => { setResult(null); setCep("") }}
                    className="flex-1 border border-zinc-200 text-zinc-600 font-medium text-sm py-2.5 rounded-lg hover:bg-zinc-50 transition-colors cursor-pointer"
                  >
                    Alterar
                  </button>
                  <button
                    onClick={handleConfirm}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold text-sm py-2.5 rounded-lg transition-colors cursor-pointer"
                  >
                    Confirmar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

"use client"

import { useState } from "react"
import { X, MapPin, Loader2, Navigation, AlertCircle } from "lucide-react"

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
  const [cep,        setCep]        = useState("")
  const [loading,    setLoading]    = useState(false)
  const [gpsLoading, setGpsLoading] = useState(false)
  const [error,      setError]      = useState("")
  const [gpsError,   setGpsError]   = useState("")
  const [result,     setResult]     = useState<(CepData & { approximate?: boolean }) | null>(null)

  if (!open) return null

  function formatCep(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 8)
    if (digits.length > 5) return `${digits.slice(0, 5)}-${digits.slice(5)}`
    return digits
  }

  // ── Manual CEP lookup ─────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const digits = cep.replace(/\D/g, "")
    if (digits.length !== 8) { setError("CEP deve ter 8 dígitos"); return }

    setLoading(true)
    setError("")
    setResult(null)

    try {
      const res = await fetch(`/api/address/cep?cep=${digits}`)
      const data = await res.json()
      if (!res.ok || data.error) { setError("CEP não encontrado"); return }
      setResult({ cep: digits, cidade: data.cidade, uf: data.estado })
    } catch {
      setError("Erro ao consultar CEP")
    } finally {
      setLoading(false)
    }
  }

  // ── GPS auto-detect ───────────────────────────────────────────────────────

  function detectLocation() {
    setGpsError("")
    setError("")

    if (!navigator.geolocation) {
      setGpsError("Geolocalização não suportada neste navegador")
      return
    }

    setGpsLoading(true)

    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude, longitude } }) => {
        try {
          const res  = await fetch(`/api/address/reverse-geocode?lat=${latitude}&lon=${longitude}`)
          const data = await res.json()

          if (!res.ok || data.error) {
            setGpsError(data.error || "Não foi possível identificar o CEP. Digite manualmente.")
            return
          }

          setResult({
            cep:         data.cep || "",
            cidade:      data.cidade,
            uf:          data.uf,
            approximate: data.approximate,
          })
        } catch {
          setGpsError("Erro ao detectar localização. Tente novamente.")
        } finally {
          setGpsLoading(false)
        }
      },
      (err) => {
        setGpsLoading(false)
        if (err.code === 1 /* PERMISSION_DENIED */) {
          setGpsError("Permissão negada. Ative a localização no navegador e tente novamente.")
        } else if (err.code === 2 /* POSITION_UNAVAILABLE */) {
          setGpsError("Sinal de GPS fraco. Tente em local aberto ou digite o CEP.")
        } else {
          setGpsError("Timeout ao buscar localização. Tente novamente.")
        }
      },
      { timeout: 12000, maximumAge: 300_000, enableHighAccuracy: false }
    )
  }

  // ── Confirm / close ───────────────────────────────────────────────────────

  function handleConfirm() {
    if (result) {
      onSave({ cep: result.cep, cidade: result.cidade, uf: result.uf })
      onClose()
      resetState()
    }
  }

  function handleClose() { onClose(); resetState() }

  function resetState() {
    setCep(""); setError(""); setGpsError(""); setResult(null)
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[61] flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-sm pointer-events-auto"
          role="dialog"
          aria-label="Informar CEP"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-red-500" aria-hidden="true" />
              <h2 className="font-semibold text-zinc-900">Informe seu CEP</h2>
            </div>
            <button
              onClick={handleClose}
              className="p-1.5 text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer rounded-lg hover:bg-zinc-100"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5">
            {!result ? (
              <div className="space-y-4">
                <p className="text-sm text-zinc-500">
                  Digite seu CEP para calcular prazos e valores de entrega.
                </p>

                {/* ── GPS button ─────────────────────────────── */}
                <button
                  type="button"
                  onClick={detectLocation}
                  disabled={gpsLoading}
                  className="w-full flex items-center justify-center gap-2.5 border-2 border-dashed border-red-200 text-red-600 hover:border-red-400 hover:bg-red-50 font-medium text-sm py-3 rounded-xl transition-all duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {gpsLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Detectando localização...
                    </>
                  ) : (
                    <>
                      <Navigation className="h-4 w-4" />
                      Usar minha localização automaticamente
                    </>
                  )}
                </button>

                {/* GPS error */}
                {gpsError && (
                  <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                    {gpsError}
                  </div>
                )}

                {/* Divider */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-zinc-100" />
                  <span className="text-xs text-zinc-400">ou digite o CEP</span>
                  <div className="flex-1 h-px bg-zinc-100" />
                </div>

                {/* ── Manual input ────────────────────────────── */}
                <form onSubmit={handleSubmit} className="space-y-3">
                  <input
                    type="text"
                    value={cep}
                    onChange={e => { setCep(formatCep(e.target.value)); setError("") }}
                    placeholder="00000-000"
                    className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-base text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-red-400 transition-colors"
                    inputMode="numeric"
                  />
                  {error && <p className="text-red-600 text-xs">{error}</p>}
                  <button
                    type="submit"
                    disabled={loading || cep.replace(/\D/g, "").length !== 8}
                    className="w-full bg-red-600 hover:bg-red-700 disabled:bg-zinc-200 disabled:text-zinc-400 text-white font-semibold text-sm py-3 rounded-xl transition-colors cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Consultando...</> : "Buscar CEP"}
                  </button>
                </form>
              </div>
            ) : (
              /* ── Result / confirmation ─────────────────────── */
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <MapPin className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-green-900 text-sm">{result.cidade} — {result.uf}</p>
                      {result.cep ? (
                        <p className="text-green-700 text-xs mt-0.5">CEP: {formatCep(result.cep)}</p>
                      ) : (
                        <p className="text-green-600 text-xs mt-0.5">Localização aproximada</p>
                      )}
                      {result.approximate && (
                        <p className="text-amber-600 text-xs mt-1 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          CEP aproximado — pode não ser exato
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <p className="text-sm text-zinc-500 text-center">
                  Esta é a sua localização? Confirme para calcular o frete.
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => { setResult(null); setCep(""); setGpsError("") }}
                    className="flex-1 border border-zinc-200 text-zinc-600 font-medium text-sm py-2.5 rounded-xl hover:bg-zinc-50 transition-colors cursor-pointer"
                  >
                    Alterar
                  </button>
                  <button
                    onClick={handleConfirm}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold text-sm py-2.5 rounded-xl transition-colors cursor-pointer"
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

"use client"

import { useState, useEffect, useCallback } from "react"
import { Loader2 } from "lucide-react"

export interface AddressData {
  cep: string
  logradouro: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  estado: string
  telefone: string
  cpf: string
}

interface AddressFormProps {
  initialAddress?: Partial<AddressData>
  initialPhone?: string
  onSubmit: (address: AddressData, saveAddress: boolean) => void
}

export function AddressForm({ initialAddress, initialPhone, onSubmit }: AddressFormProps) {
  const [form, setForm] = useState<AddressData>({
    cep: "",
    logradouro: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: "",
    telefone: "",
    cpf: "",
  })
  const [saveAddress, setSaveAddress] = useState(true)
  const [loadingCep, setLoadingCep] = useState(false)
  const [cepError, setCepError] = useState("")

  useEffect(() => {
    if (initialAddress) {
      setForm((prev) => ({
        ...prev,
        cep: initialAddress.cep || "",
        logradouro: initialAddress.logradouro || "",
        numero: initialAddress.numero || "",
        complemento: initialAddress.complemento || "",
        bairro: initialAddress.bairro || "",
        cidade: initialAddress.cidade || "",
        estado: initialAddress.estado || "",
      }))
    }
    if (initialPhone) {
      setForm((prev) => ({ ...prev, telefone: initialPhone }))
    }
  }, [initialAddress, initialPhone])

  const fetchCep = useCallback(async (cep: string) => {
    const clean = cep.replace(/\D/g, "")
    if (clean.length !== 8) return

    setLoadingCep(true)
    setCepError("")

    try {
      const res = await fetch(`/api/address/cep?cep=${clean}`)
      const data = await res.json()

      if (!res.ok) {
        setCepError(data.error || "CEP não encontrado")
        return
      }

      setForm((prev) => ({
        ...prev,
        logradouro: data.logradouro || prev.logradouro,
        bairro: data.bairro || prev.bairro,
        cidade: data.cidade || prev.cidade,
        estado: data.estado || prev.estado,
      }))
    } catch {
      setCepError("Erro ao buscar CEP")
    } finally {
      setLoadingCep(false)
    }
  }, [])

  function handleCepChange(value: string) {
    const masked = value.replace(/\D/g, "").replace(/(\d{5})(\d)/, "$1-$2").slice(0, 9)
    setForm((prev) => ({ ...prev, cep: masked }))

    if (masked.replace(/\D/g, "").length === 8) {
      fetchCep(masked)
    }
  }

  function handleCpfChange(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 11)
    const masked = digits
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
    setForm((prev) => ({ ...prev, cpf: masked }))
  }

  function handlePhoneChange(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 11)
    let masked = digits
    if (digits.length > 2) masked = `(${digits.slice(0, 2)}) ${digits.slice(2)}`
    if (digits.length > 7) masked = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
    setForm((prev) => ({ ...prev, telefone: masked }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit(form, saveAddress)
  }

  const inputClass = "w-full px-4 py-3 border border-zinc-200 font-inter text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all rounded-lg"

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-1">
          <label htmlFor="cep" className="block font-inter text-sm font-medium text-zinc-700 mb-1.5">
            CEP
          </label>
          <div className="relative">
            <input
              id="cep"
              type="text"
              required
              value={form.cep}
              onChange={(e) => handleCepChange(e.target.value)}
              className={inputClass}
              placeholder="00000-000"
            />
            {loadingCep && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-zinc-400" />
            )}
          </div>
          {cepError && <p className="font-inter text-xs text-red-600 mt-1">{cepError}</p>}
        </div>

        <div className="sm:col-span-1">
          <label htmlFor="estado" className="block font-inter text-sm font-medium text-zinc-700 mb-1.5">
            Estado
          </label>
          <input
            id="estado"
            type="text"
            required
            value={form.estado}
            onChange={(e) => setForm((prev) => ({ ...prev, estado: e.target.value }))}
            className={inputClass}
            placeholder="UF"
            maxLength={2}
          />
        </div>
      </div>

      <div>
        <label htmlFor="logradouro" className="block font-inter text-sm font-medium text-zinc-700 mb-1.5">
          Rua / Avenida
        </label>
        <input
          id="logradouro"
          type="text"
          required
          value={form.logradouro}
          onChange={(e) => setForm((prev) => ({ ...prev, logradouro: e.target.value }))}
          className={inputClass}
          placeholder="Nome da rua"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label htmlFor="numero" className="block font-inter text-sm font-medium text-zinc-700 mb-1.5">
            Número
          </label>
          <input
            id="numero"
            type="text"
            required
            value={form.numero}
            onChange={(e) => setForm((prev) => ({ ...prev, numero: e.target.value }))}
            className={inputClass}
            placeholder="123"
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="complemento" className="block font-inter text-sm font-medium text-zinc-700 mb-1.5">
            Complemento
          </label>
          <input
            id="complemento"
            type="text"
            value={form.complemento}
            onChange={(e) => setForm((prev) => ({ ...prev, complemento: e.target.value }))}
            className={inputClass}
            placeholder="Apto, bloco..."
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="bairro" className="block font-inter text-sm font-medium text-zinc-700 mb-1.5">
            Bairro
          </label>
          <input
            id="bairro"
            type="text"
            required
            value={form.bairro}
            onChange={(e) => setForm((prev) => ({ ...prev, bairro: e.target.value }))}
            className={inputClass}
            placeholder="Bairro"
          />
        </div>
        <div>
          <label htmlFor="cidade" className="block font-inter text-sm font-medium text-zinc-700 mb-1.5">
            Cidade
          </label>
          <input
            id="cidade"
            type="text"
            required
            value={form.cidade}
            onChange={(e) => setForm((prev) => ({ ...prev, cidade: e.target.value }))}
            className={inputClass}
            placeholder="Cidade"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="telefone" className="block font-inter text-sm font-medium text-zinc-700 mb-1.5">
            Telefone
          </label>
          <input
            id="telefone"
            type="text"
            required
            value={form.telefone}
            onChange={(e) => handlePhoneChange(e.target.value)}
            className={inputClass}
            placeholder="(00) 00000-0000"
          />
        </div>
        <div>
          <label htmlFor="cpf" className="block font-inter text-sm font-medium text-zinc-700 mb-1.5">
            CPF
          </label>
          <input
            id="cpf"
            type="text"
            required
            value={form.cpf}
            onChange={(e) => handleCpfChange(e.target.value)}
            className={inputClass}
            placeholder="000.000.000-00"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={saveAddress}
          onChange={(e) => setSaveAddress(e.target.checked)}
          className="w-4 h-4 rounded border-zinc-300 text-red-600 focus:ring-red-500 cursor-pointer"
        />
        <span className="font-inter text-sm text-zinc-700">Salvar endereço para próximas compras</span>
      </label>

      <button
        type="submit"
        className="w-full bg-red-600 hover:bg-red-700 text-white font-inter font-semibold text-sm px-6 py-3.5 min-h-[48px] transition-colors duration-200 cursor-pointer rounded-xl"
      >
        Continuar para o frete
      </button>
    </form>
  )
}

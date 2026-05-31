"use client"

import { useState, useEffect } from "react"
import { Loader2, Save } from "lucide-react"

export default function ProfilePage() {
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState({
    cep: "",
    logradouro: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: "",
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    fetch("/api/profile")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setName(data.name || "")
          setPhone(data.phone || "")
          if (data.address_json) setAddress(data.address_json)
        }
      })
      .finally(() => setLoading(false))
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage("")

    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone, address_json: address }),
    })

    if (res.ok) {
      setMessage("Perfil atualizado com sucesso!")
    } else {
      setMessage("Erro ao salvar. Tente novamente.")
    }
    setSaving(false)
  }

  function handleCepChange(value: string) {
    const masked = value.replace(/\D/g, "").replace(/(\d{5})(\d)/, "$1-$2").slice(0, 9)
    setAddress((prev) => ({ ...prev, cep: masked }))

    const clean = masked.replace(/\D/g, "")
    if (clean.length === 8) {
      fetch(`/api/address/cep?cep=${clean}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) {
            setAddress((prev) => ({
              ...prev,
              logradouro: data.logradouro || prev.logradouro,
              bairro: data.bairro || prev.bairro,
              cidade: data.cidade || prev.cidade,
              estado: data.estado || prev.estado,
            }))
          }
        })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
      </div>
    )
  }

  const inputClass = "w-full px-4 py-3 border border-zinc-200 font-inter text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all rounded-lg"

  return (
    <div className="bg-white border border-zinc-100 rounded-xl p-6 shadow-sm">
      <h2 className="font-inter font-semibold text-lg text-zinc-900 mb-6">Meu Perfil</h2>

      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-inter text-sm font-medium text-zinc-700 mb-1.5">Nome</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="Seu nome" />
          </div>
          <div>
            <label className="block font-inter text-sm font-medium text-zinc-700 mb-1.5">Telefone</label>
            <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} placeholder="(00) 00000-0000" />
          </div>
        </div>

        <h3 className="font-inter text-sm font-semibold text-zinc-900 pt-4">Endereço</h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block font-inter text-sm font-medium text-zinc-700 mb-1.5">CEP</label>
            <input type="text" value={address.cep} onChange={(e) => handleCepChange(e.target.value)} className={inputClass} placeholder="00000-000" />
          </div>
          <div className="sm:col-span-2">
            <label className="block font-inter text-sm font-medium text-zinc-700 mb-1.5">Rua</label>
            <input type="text" value={address.logradouro} onChange={(e) => setAddress((p) => ({ ...p, logradouro: e.target.value }))} className={inputClass} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block font-inter text-sm font-medium text-zinc-700 mb-1.5">Número</label>
            <input type="text" value={address.numero} onChange={(e) => setAddress((p) => ({ ...p, numero: e.target.value }))} className={inputClass} />
          </div>
          <div>
            <label className="block font-inter text-sm font-medium text-zinc-700 mb-1.5">Complemento</label>
            <input type="text" value={address.complemento} onChange={(e) => setAddress((p) => ({ ...p, complemento: e.target.value }))} className={inputClass} />
          </div>
          <div>
            <label className="block font-inter text-sm font-medium text-zinc-700 mb-1.5">Bairro</label>
            <input type="text" value={address.bairro} onChange={(e) => setAddress((p) => ({ ...p, bairro: e.target.value }))} className={inputClass} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-inter text-sm font-medium text-zinc-700 mb-1.5">Cidade</label>
            <input type="text" value={address.cidade} onChange={(e) => setAddress((p) => ({ ...p, cidade: e.target.value }))} className={inputClass} />
          </div>
          <div>
            <label className="block font-inter text-sm font-medium text-zinc-700 mb-1.5">Estado</label>
            <input type="text" value={address.estado} onChange={(e) => setAddress((p) => ({ ...p, estado: e.target.value }))} className={inputClass} maxLength={2} />
          </div>
        </div>

        {message && (
          <p className={`font-inter text-sm px-3 py-2 rounded-lg ${message.includes("sucesso") ? "text-green-700 bg-green-50" : "text-red-600 bg-red-50"}`}>
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-inter font-semibold text-sm px-6 py-3.5 min-h-[48px] transition-colors duration-200 cursor-pointer rounded-xl"
        >
          <Save className="h-4 w-4" />
          {saving ? "Salvando..." : "Salvar alterações"}
        </button>
      </form>
    </div>
  )
}

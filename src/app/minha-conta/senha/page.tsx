"use client"

import { useState } from "react"
import { Lock, CheckCircle } from "lucide-react"
import { supabaseBrowser } from "@/lib/supabase-browser"

export default function ChangePasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.")
      return
    }
    if (password !== confirmPassword) {
      setError("As senhas nao coincidem.")
      return
    }

    setLoading(true)

    try {
      const { error: updateError } = await supabaseBrowser.auth.updateUser({ password })

      if (updateError) {
        setError(updateError.message)
        return
      }

      setSuccess(true)
      setPassword("")
      setConfirmPassword("")
    } catch {
      setError("Erro ao alterar senha. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white border border-zinc-100 rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <Lock className="h-5 w-5 text-zinc-400" />
        <h2 className="font-inter font-semibold text-lg text-zinc-900">Alterar Senha</h2>
      </div>

      {success && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-3 mb-6">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <p className="text-sm text-green-700 font-inter">Senha alterada com sucesso.</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <div>
          <label htmlFor="new-password" className="block font-inter text-sm font-medium text-zinc-700 mb-1.5">
            Nova senha
          </label>
          <input
            id="new-password"
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(""); setSuccess(false) }}
            placeholder="Minimo 6 caracteres"
            required
            minLength={6}
            className="w-full px-4 py-3 border border-zinc-200 font-inter text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all rounded-lg"
          />
        </div>
        <div>
          <label htmlFor="confirm-password" className="block font-inter text-sm font-medium text-zinc-700 mb-1.5">
            Confirmar nova senha
          </label>
          <input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => { setConfirmPassword(e.target.value); setError(""); setSuccess(false) }}
            placeholder="Repita a nova senha"
            required
            minLength={6}
            className="w-full px-4 py-3 border border-zinc-200 font-inter text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all rounded-lg"
          />
        </div>

        {error && <p className="text-red-600 text-sm font-inter">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-inter font-semibold text-sm px-6 py-3 rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
        >
          {loading ? "Salvando..." : "Alterar senha"}
        </button>
      </form>
    </div>
  )
}

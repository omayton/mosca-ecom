'use client'

import { useState, useEffect } from 'react'
import { Lock, CheckCircle, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { supabaseBrowser } from '@/lib/supabase-browser'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [sessionReady, setSessionReady] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    // Supabase automatically picks up the token from the URL hash
    const { data: { subscription } } = supabaseBrowser.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSessionReady(true)
        setChecking(false)
      }
    })

    // Give Supabase time to process the URL hash token
    const timeout = setTimeout(() => {
      setChecking(false)
    }, 3000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      return
    }
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.')
      return
    }

    setLoading(true)

    try {
      const { error: updateError } = await supabaseBrowser.auth.updateUser({
        password,
      })

      if (updateError) {
        setError(updateError.message)
        return
      }

      setSuccess(true)
    } catch {
      setError('Erro ao redefinir senha. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-white border border-zinc-100 rounded-xl shadow-sm p-8 text-center">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="font-bold text-zinc-900 text-xl mb-2">Senha redefinida!</h1>
            <p className="text-zinc-500 text-sm mb-6">
              Sua senha foi alterada com sucesso. Você já pode fazer login.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center justify-center w-full bg-red-600 hover:bg-red-700 text-white font-semibold text-sm py-3 rounded-lg transition-colors cursor-pointer"
            >
              Ir para o login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!sessionReady && checking) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-white border border-zinc-100 rounded-xl shadow-sm p-8 text-center">
            <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <Lock className="h-8 w-8 text-zinc-400" />
            </div>
            <p className="text-zinc-500 text-sm">Verificando link de recuperação...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!sessionReady) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-white border border-zinc-100 rounded-xl shadow-sm p-8 text-center">
            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-8 w-8 text-amber-600" />
            </div>
            <h1 className="font-bold text-zinc-900 text-xl mb-2">Link inválido ou expirado</h1>
            <p className="text-zinc-500 text-sm mb-6">
              Este link de recuperação pode ter expirado. Solicite um novo link.
            </p>
            <Link
              href="/esqueci-senha"
              className="inline-flex items-center justify-center w-full bg-red-600 hover:bg-red-700 text-white font-semibold text-sm py-3 rounded-lg transition-colors cursor-pointer"
            >
              Solicitar novo link
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white border border-zinc-100 rounded-xl shadow-sm p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="font-bold text-zinc-900 text-xl mb-1">Nova senha</h1>
            <p className="text-zinc-500 text-sm">
              Digite sua nova senha abaixo.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-zinc-700 mb-1.5">
                Nova senha
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError('') }}
                placeholder="Mínimo 6 caracteres"
                required
                minLength={6}
                className="w-full border border-zinc-200 rounded-lg px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-red-300 transition-colors"
                autoFocus
              />
            </div>
            <div>
              <label htmlFor="confirm" className="block text-sm font-medium text-zinc-700 mb-1.5">
                Confirmar senha
              </label>
              <input
                id="confirm"
                type="password"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setError('') }}
                placeholder="Repita a nova senha"
                required
                minLength={6}
                className="w-full border border-zinc-200 rounded-lg px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-red-300 transition-colors"
              />
            </div>

            {error && <p className="text-red-600 text-xs">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-zinc-300 text-white font-semibold text-sm py-3 rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              {loading ? 'Salvando...' : 'Redefinir senha'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

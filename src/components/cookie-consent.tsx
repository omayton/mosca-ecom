"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

const COOKIE_CONSENT_KEY = "mosca-cookie-consent"

export function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY)
    if (!consent) {
      // Small delay to avoid layout shift on load
      const timer = setTimeout(() => setVisible(true), 1000)
      return () => clearTimeout(timer)
    }
  }, [])

  function accept() {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({ accepted: true, date: new Date().toISOString() }))
    setVisible(false)
  }

  function decline() {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({ accepted: false, date: new Date().toISOString() }))
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 pointer-events-none">
      <div className="container mx-auto max-w-4xl pointer-events-auto">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <p className="text-sm text-white/90 leading-relaxed">
              Utilizamos cookies essenciais para o funcionamento do site e cookies analíticos para melhorar sua experiência.{" "}
              <Link href="/politica-de-privacidade" className="text-red-400 hover:text-red-300 underline underline-offset-2 transition-colors">
                Saiba mais
              </Link>
            </p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={decline}
              className="px-4 py-2 text-sm text-white/60 hover:text-white border border-white/10 hover:border-white/20 rounded-lg transition-colors cursor-pointer"
            >
              Recusar
            </button>
            <button
              onClick={accept}
              className="px-5 py-2 text-sm font-semibold text-black bg-white hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
            >
              Aceitar cookies
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

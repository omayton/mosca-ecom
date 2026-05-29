"use client"

import { useState } from "react"

export function NewsletterForm() {
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <p className="font-jost text-sm text-stone-700 py-4">
        Obrigado! Confira sua caixa de entrada para o cupom de 10%.
      </p>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col sm:flex-row gap-3"
      aria-label="Formulário de cadastro na newsletter"
    >
      <label htmlFor="newsletter-email" className="sr-only">
        Seu melhor e-mail
      </label>
      <input
        id="newsletter-email"
        type="email"
        required
        placeholder="Seu melhor e-mail"
        autoComplete="email"
        className="flex-1 bg-white border border-stone-200 text-stone-900 font-jost text-sm px-5 py-3.5 min-h-[52px] placeholder:text-stone-400 focus:outline-none focus:border-stone-900 transition-colors duration-200"
      />
      <button
        type="submit"
        className="bg-stone-900 text-stone-50 font-jost text-xs font-semibold tracking-widest uppercase px-8 py-3.5 min-h-[52px] hover:bg-gold transition-colors duration-300 whitespace-nowrap cursor-pointer"
      >
        Cadastrar
      </button>
    </form>
  )
}

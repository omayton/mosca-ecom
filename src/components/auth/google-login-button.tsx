"use client"

export function GoogleLoginButton() {
  return (
    <a
      href="/api/auth/google"
      className="w-full flex items-center justify-center gap-3 bg-white border border-zinc-200 text-zinc-800 font-medium text-sm px-6 py-3.5 min-h-[48px] rounded-xl hover:bg-zinc-50 hover:border-zinc-300 transition-all duration-200 cursor-pointer"
    >
      <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-1.25-.58C19.84 9.15 17.74 6.5 15.01 6.5H10.5c-1.47 0-2.84.43-3.91-1.16C5.28 6.09 3.87 8.46 2.28 10.11l5.07 4.92c.08-.68.07-1.36.04-2.04-.03-1.25.88-2.07 2.54-2.48 4.43-2.59 7.03l-2.52.83c.2-.36.68-.83 1.01-1.29L4.37 18.7c-.29.77-.55-1.6-.3-2.13-.03l.37.04c.37.82.62 1.77.52 2.39-.14l1.64-4.1c.38 1.12 1.34 1.77 2.47 1.77h3.04c.01 0 .01 0 .01.02l.25.04c.61.02 1.2.41 2.37.53 3.47l-4.5 5.94c-.07.08-.13-.15-.2-.22a.9.9 0 0 0-.19-.19l-5.72 5.72a.9.9 0 0 0-.19.19l-2.24-2.24a.9.9 0 0 0 .19-.19l5.72-5.72a.9.9 0 0 0 .19-.19.19.19v.39c0 .29.15.55.46.55h6.42c.44 0 .8-.36.8-.8H6.42a.9.9 0 0 0 .19.19v.39a.9.9 0 0 0 .19-.19.19.19L7.23 18.73a.9.9 0 0 0 .19.19c.44.42.84.37 1.55-.37h1.5" fill="#4285F4"/>
      </svg>
      Entrar com Google
    </a>
  )
}

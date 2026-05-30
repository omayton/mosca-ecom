"use client"

import { useState, useEffect, useCallback } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

const SLIDES = [
  {
    id: 1,
    eyebrow: "Peças difíceis de encontrar? Aqui tem.",
    title: "PEÇAS RARAS",
    sub1: "Encontre o que",
    sub2: "parecia impossível",
    badge: "5% OFF pagando com PIX",
    cta: "Ver catálogo",
    bg: "bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-800",
    iconColor: "#9CA3AF",
    accentFrom: "from-red-700",
    accentTo: "to-red-600",
  },
  {
    id: 2,
    eyebrow: "Válido em todo o site",
    title: "5% OFF",
    sub1: "Pagando",
    sub2: "com PIX",
    badge: "Parcele em até 6x sem juros",
    cta: "Aproveitar",
    bg: "bg-gradient-to-r from-zinc-950 via-red-950/40 to-zinc-900",
    iconColor: "#EF4444",
    accentFrom: "from-green-700",
    accentTo: "to-green-600",
  },
  {
    id: 3,
    eyebrow: "Motor, freios, suspensão e mais",
    title: "COMPONENTES",
    sub1: "Garantia de",
    sub2: "30 dias",
    badge: "Envio nacional via Correios",
    cta: "Ver produtos",
    bg: "bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-800",
    iconColor: "#D4D4D8",
    accentFrom: "from-zinc-700",
    accentTo: "to-zinc-600",
  },
]

function GearGraphic({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-lg" aria-hidden="true">
      {/* Outer gear */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i * 30 * Math.PI) / 180
        const x = 100 + Math.cos(angle) * 82
        const y = 100 + Math.sin(angle) * 82
        return (
          <rect
            key={i}
            x={x - 6}
            y={y - 10}
            width="12"
            height="20"
            rx="3"
            fill={color}
            opacity="0.8"
            transform={`rotate(${i * 30} ${x} ${y})`}
          />
        )
      })}
      {/* Outer ring */}
      <circle cx="100" cy="100" r="72" fill={color} opacity="0.15" />
      <circle cx="100" cy="100" r="68" fill="#111" />
      <circle cx="100" cy="100" r="60" fill={color} opacity="0.2" />
      {/* Spokes */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
        <line
          key={a}
          x1="100" y1="100"
          x2={100 + Math.cos((a * Math.PI) / 180) * 55}
          y2={100 + Math.sin((a * Math.PI) / 180) * 55}
          stroke={color}
          strokeWidth="4"
          opacity="0.5"
        />
      ))}
      {/* Center */}
      <circle cx="100" cy="100" r="22" fill={color} opacity="0.9" />
      <circle cx="100" cy="100" r="12" fill="#111" />
      <circle cx="100" cy="100" r="5"  fill={color} opacity="0.7" />
    </svg>
  )
}

export function HeroCarousel() {
  const [current, setCurrent] = useState(0)
  const [paused,  setPaused]  = useState(false)

  const next = useCallback(() => setCurrent((c) => (c + 1) % SLIDES.length), [])
  const prev = useCallback(() => setCurrent((c) => (c - 1 + SLIDES.length) % SLIDES.length), [])

  useEffect(() => {
    if (paused) return
    const id = setInterval(next, 4500)
    return () => clearInterval(id)
  }, [paused, next])

  const slide = SLIDES[current]

  return (
    <section
      aria-label="Banner promocional"
      aria-roledescription="carrossel"
      className={`relative w-full overflow-hidden ${slide.bg} transition-colors duration-700`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center min-h-[340px] md:min-h-[400px] py-12 gap-10">

          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className="inline-flex items-center border border-white/20 text-white/70 font-inter text-xs px-5 py-1.5 rounded-full mb-6 tracking-wide">
              {slide.eyebrow}
            </p>

            <h2
              className="font-barlow font-black text-white leading-none mb-3"
              style={{ fontSize: "clamp(2.5rem, 7vw, 5.5rem)" }}
            >
              {slide.title}
            </h2>

            <div className="mb-6">
              <p className="text-white/70 font-inter text-base">{slide.sub1}</p>
              <p className="font-barlow font-bold text-white text-3xl leading-tight">{slide.sub2}</p>
            </div>

            <div className={`hidden sm:inline-flex items-center gap-2 bg-gradient-to-r ${slide.accentFrom} ${slide.accentTo} text-white font-inter font-semibold text-sm px-5 py-2 rounded-full mb-6`}>
              <span className="text-lg">+</span>
              {slide.badge}
            </div>

            <div className="block">
              <a
                href="#"
                className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-inter font-semibold text-sm px-8 py-3 min-h-[48px] transition-all duration-200 rounded-lg"
                aria-label={`${slide.cta}`}
              >
                {slide.cta}
                <ChevronRight className="h-5 w-5" aria-hidden="true" />
              </a>
            </div>
          </div>

          {/* Graphic */}
          <div className="hidden sm:block flex-shrink-0 w-48 h-52 md:w-64 md:h-64 relative opacity-80">
            <div className="absolute inset-0 rounded-full opacity-10 blur-3xl scale-125" style={{ background: slide.iconColor }} aria-hidden="true" />
            <GearGraphic color={slide.iconColor} />
          </div>
        </div>
      </div>

      {/* Prev / Next */}
      <button onClick={prev} aria-label="Slide anterior" className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 min-w-[44px] min-h-[44px] bg-zinc-950/40 hover:bg-zinc-950/70 text-white flex items-center justify-center transition-all duration-200 rounded-full">
        <ChevronLeft className="h-6 w-6" aria-hidden="true" />
      </button>
      <button onClick={next} aria-label="Próximo slide" className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 min-w-[44px] min-h-[44px] bg-zinc-950/40 hover:bg-zinc-950/70 text-white flex items-center justify-center transition-all duration-200 rounded-full">
        <ChevronRight className="h-6 w-6" aria-hidden="true" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2" role="tablist" aria-label="Slides">
        {SLIDES.map((s, i) => (
          <button
            key={s.id}
            role="tab"
            aria-selected={i === current}
            aria-label={`Slide ${i + 1}`}
            onClick={() => setCurrent(i)}
            className={`transition-all duration-300 rounded-full ${i === current ? "w-6 h-2 bg-red-500" : "w-2 h-2 bg-white/40 hover:bg-white/70"}`}
          />
        ))}
      </div>
    </section>
  )
}

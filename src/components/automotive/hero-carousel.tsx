"use client"

import { useState, useEffect, useCallback } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface BannerSlide {
  id: number
  title: string
  subtitle: string | null
  tag: string | null
  cta_text: string
  cta_link: string
  product_image_url: string | null
  bg_color: string
  accent_color: string
  text_color: string
}

const FALLBACK_SLIDES: BannerSlide[] = [
  {
    id: 1,
    title: "PEÇAS RARAS",
    subtitle: "Encontre o que parecia impossível",
    tag: "Peças difíceis de encontrar? Aqui tem.",
    cta_text: "Ver catálogo",
    cta_link: "/produtos",
    product_image_url: null,
    bg_color: "#0a0a0b",
    accent_color: "#dc2626",
    text_color: "#ffffff",
  },
  {
    id: 2,
    title: "5% OFF NO PIX",
    subtitle: "Parcele em até 6x sem juros",
    tag: "Válido em todo o site",
    cta_text: "Aproveitar",
    cta_link: "/produtos",
    product_image_url: null,
    bg_color: "#0a0a0b",
    accent_color: "#16a34a",
    text_color: "#ffffff",
  },
  {
    id: 3,
    title: "COMPONENTES",
    subtitle: "Garantia de 30 dias • Envio nacional",
    tag: "Motor, freios, suspensão e mais",
    cta_text: "Ver produtos",
    cta_link: "/produtos",
    product_image_url: null,
    bg_color: "#0a0a0b",
    accent_color: "#71717a",
    text_color: "#ffffff",
  },
]

export function HeroCarousel() {
  const [slides, setSlides] = useState<BannerSlide[]>(FALLBACK_SLIDES)
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)

  // Fetch banners from API
  useEffect(() => {
    async function fetchBanners() {
      try {
        const res = await fetch('/api/admin/banners?active=true')
        if (res.ok) {
          const data = await res.json()
          if (data.banners && data.banners.length > 0) {
            setSlides(data.banners)
          }
        }
      } catch (err) {
        // Use fallback slides
      }
    }
    fetchBanners()
  }, [])

  const next = useCallback(() => setCurrent((c) => (c + 1) % slides.length), [slides.length])
  const prev = useCallback(() => setCurrent((c) => (c - 1 + slides.length) % slides.length), [slides.length])

  useEffect(() => {
    if (paused) return
    const id = setInterval(next, 5000)
    return () => clearInterval(id)
  }, [paused, next])

  const slide = slides[current]
  if (!slide) return null

  return (
    <section
      aria-label="Banner promocional"
      aria-roledescription="carrossel"
      className="relative w-full overflow-hidden transition-colors duration-700"
      style={{ backgroundColor: slide.bg_color }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center min-h-[340px] md:min-h-[400px] py-12 gap-10">

          {/* Text */}
          <div className="flex-1 min-w-0">
            {slide.tag && (
              <span
                className="inline-flex items-center text-xs font-bold uppercase tracking-wider px-4 py-1.5 rounded-full mb-6"
                style={{ backgroundColor: slide.accent_color, color: '#fff' }}
              >
                {slide.tag}
              </span>
            )}

            <h2
              className="font-barlow font-black leading-none mb-4"
              style={{ fontSize: "clamp(2.2rem, 6vw, 4.5rem)", color: slide.text_color }}
            >
              {slide.title}
            </h2>

            {slide.subtitle && (
              <p
                className="text-lg mb-8 opacity-70 max-w-md"
                style={{ color: slide.text_color }}
              >
                {slide.subtitle}
              </p>
            )}

            <a
              href={slide.cta_link}
              className="inline-flex items-center gap-2 font-semibold text-sm px-8 py-3.5 min-h-[48px] transition-all duration-200 rounded-lg hover:opacity-90"
              style={{ backgroundColor: slide.accent_color, color: '#fff' }}
            >
              {slide.cta_text}
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </a>
          </div>

          {/* Product Image or Gear Graphic */}
          <div className="hidden sm:flex flex-shrink-0 w-48 h-52 md:w-72 md:h-72 relative items-center justify-center">
            {slide.product_image_url ? (
              <img
                src={slide.product_image_url}
                alt=""
                className="max-w-full max-h-full object-contain drop-shadow-2xl"
              />
            ) : (
              <div className="w-full h-full opacity-60">
                <GearGraphic color={slide.accent_color} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Prev / Next */}
      <button onClick={prev} aria-label="Slide anterior" className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 min-w-[44px] min-h-[44px] bg-black/30 hover:bg-black/60 text-white flex items-center justify-center transition-all duration-200 rounded-full backdrop-blur-sm">
        <ChevronLeft className="h-6 w-6" aria-hidden="true" />
      </button>
      <button onClick={next} aria-label="Próximo slide" className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 min-w-[44px] min-h-[44px] bg-black/30 hover:bg-black/60 text-white flex items-center justify-center transition-all duration-200 rounded-full backdrop-blur-sm">
        <ChevronRight className="h-6 w-6" aria-hidden="true" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2" role="tablist" aria-label="Slides">
        {slides.map((s, i) => (
          <button
            key={s.id}
            role="tab"
            aria-selected={i === current}
            aria-label={`Slide ${i + 1}`}
            onClick={() => setCurrent(i)}
            className="transition-all duration-300 rounded-full"
            style={{
              width: i === current ? '24px' : '8px',
              height: '8px',
              backgroundColor: i === current ? slide.accent_color : 'rgba(255,255,255,0.3)',
            }}
          />
        ))}
      </div>
    </section>
  )
}

function GearGraphic({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-lg" aria-hidden="true">
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
      <circle cx="100" cy="100" r="72" fill={color} opacity="0.15" />
      <circle cx="100" cy="100" r="68" fill="#111" />
      <circle cx="100" cy="100" r="60" fill={color} opacity="0.2" />
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
      <circle cx="100" cy="100" r="22" fill={color} opacity="0.9" />
      <circle cx="100" cy="100" r="12" fill="#111" />
      <circle cx="100" cy="100" r="5" fill={color} opacity="0.7" />
    </svg>
  )
}
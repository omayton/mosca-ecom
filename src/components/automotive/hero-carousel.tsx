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
  desktop_image_url: string | null
  bg_color: string
  accent_color: string
  text_color: string
}

const FALLBACK_SLIDES: BannerSlide[] = [
  {
    id: 1,
    title: "PECAS RARAS",
    subtitle: "Encontre o que parecia impossivel",
    tag: "Pecas dificeis de encontrar? Aqui tem.",
    cta_text: "Ver catalogo",
    cta_link: "/loja",
    product_image_url: null,
    desktop_image_url: null,
    bg_color: "#f4f4f5",
    accent_color: "#dc2626",
    text_color: "#18181b",
  },
  {
    id: 2,
    title: "5% OFF NO PIX",
    subtitle: "Parcele em ate 6x sem juros",
    tag: "Valido em todo o site",
    cta_text: "Aproveitar",
    cta_link: "/loja",
    product_image_url: null,
    desktop_image_url: null,
    bg_color: "#f0fdf4",
    accent_color: "#16a34a",
    text_color: "#14532d",
  },
  {
    id: 3,
    title: "COMPONENTES",
    subtitle: "Garantia de 30 dias - Envio nacional",
    tag: "Motor, freios, suspensao e mais",
    cta_text: "Ver produtos",
    cta_link: "/loja",
    product_image_url: null,
    desktop_image_url: null,
    bg_color: "#fafafa",
    accent_color: "#18181b",
    text_color: "#18181b",
  },
]

export function HeroCarousel() {
  const [slides, setSlides] = useState<BannerSlide[]>(FALLBACK_SLIDES)
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)

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
      } catch {
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

  const hasDesktopImage = !!slide.desktop_image_url
  const isDarkBg = isColorDark(slide.bg_color)

  return (
    <section
      aria-label="Banner promocional"
      aria-roledescription="carrossel"
      className="relative w-full overflow-hidden transition-colors duration-700"
      style={{ backgroundColor: slide.bg_color }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Desktop: full generated image if available */}
      {hasDesktopImage && (
        <div className="hidden md:block relative w-full">
          <a href={slide.cta_link} className="block">
            <img
              src={slide.desktop_image_url!}
              alt={slide.title}
              className="w-full h-auto min-h-[400px] max-h-[480px] object-cover"
            />
          </a>
        </div>
      )}

      {/* Desktop HTML fallback (no desktop_image_url) */}
      {!hasDesktopImage && (
        <div className="hidden md:block">
          <div className="container mx-auto px-4">
            <div className="flex items-center min-h-[400px] py-12 gap-10">
              <SlideContent slide={slide} />
              <SlideProductImage slide={slide} />
            </div>
          </div>
        </div>
      )}

      {/* Mobile: always HTML layout */}
      <div className={hasDesktopImage ? "md:hidden" : "md:hidden"}>
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center min-h-[320px] py-10 gap-6 text-center">
            <SlideContent slide={slide} centered />
            {slide.product_image_url && (
              <div className="w-40 h-40 relative flex items-center justify-center">
                <div
                  className="absolute inset-0 rounded-full opacity-80"
                  style={{
                    background: `radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.6) 60%, transparent 80%)`,
                  }}
                />
                <img
                  src={slide.product_image_url}
                  alt=""
                  className="relative z-10 max-w-[80%] max-h-[80%] object-contain drop-shadow-lg"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Prev / Next */}
      <button
        onClick={prev}
        aria-label="Slide anterior"
        className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 min-w-[44px] min-h-[44px] flex items-center justify-center transition-all duration-200 rounded-full backdrop-blur-sm"
        style={{
          backgroundColor: isDarkBg ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
          color: isDarkBg ? '#fff' : '#18181b',
        }}
      >
        <ChevronLeft className="h-5 w-5" aria-hidden="true" />
      </button>
      <button
        onClick={next}
        aria-label="Proximo slide"
        className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 min-w-[44px] min-h-[44px] flex items-center justify-center transition-all duration-200 rounded-full backdrop-blur-sm"
        style={{
          backgroundColor: isDarkBg ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
          color: isDarkBg ? '#fff' : '#18181b',
        }}
      >
        <ChevronRight className="h-5 w-5" aria-hidden="true" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2" role="tablist" aria-label="Slides">
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
              backgroundColor: i === current
                ? slide.accent_color
                : isDarkBg ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.15)',
            }}
          />
        ))}
      </div>
    </section>
  )
}

function SlideContent({ slide, centered }: { slide: BannerSlide; centered?: boolean }) {
  return (
    <div className={`flex-1 min-w-0 ${centered ? 'flex flex-col items-center' : ''}`}>
      {slide.tag && (
        <span
          className="inline-flex items-center text-xs font-bold uppercase tracking-wider px-4 py-1.5 rounded-full mb-5"
          style={{ backgroundColor: slide.accent_color, color: '#fff' }}
        >
          {slide.tag}
        </span>
      )}

      <h2
        className="font-black leading-none mb-3"
        style={{ fontSize: centered ? "clamp(1.5rem, 6vw, 2rem)" : "clamp(1.8rem, 4vw, 3rem)", color: slide.text_color }}
      >
        {slide.title}
      </h2>

      {slide.subtitle && (
        <p
          className="text-base mb-7 opacity-70 max-w-md"
          style={{ color: slide.text_color }}
        >
          {slide.subtitle}
        </p>
      )}

      <a
        href={slide.cta_link}
        className="inline-flex items-center gap-2 font-semibold text-sm px-7 py-3 min-h-[44px] transition-all duration-200 rounded-lg hover:opacity-90 cursor-pointer"
        style={{ backgroundColor: slide.accent_color, color: '#fff' }}
      >
        {slide.cta_text}
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </a>
    </div>
  )
}

function SlideProductImage({ slide }: { slide: BannerSlide }) {
  if (!slide.product_image_url) {
    return (
      <div className="flex-shrink-0 w-72 h-72 opacity-50">
        <GearGraphic color={slide.accent_color} />
      </div>
    )
  }

  return (
    <div className="flex-shrink-0 w-56 h-56 md:w-72 md:h-72 relative flex items-center justify-center">
      {/* Light backdrop for product visibility */}
      <div
        className="absolute inset-0 rounded-3xl"
        style={{
          background: `radial-gradient(ellipse at center, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.7) 50%, rgba(255,255,255,0.2) 75%, transparent 100%)`,
        }}
      />
      {/* Subtle accent ring */}
      <div
        className="absolute inset-6 rounded-full blur-2xl opacity-10"
        style={{ backgroundColor: slide.accent_color }}
      />
      <img
        src={slide.product_image_url}
        alt=""
        className="relative z-10 max-w-[80%] max-h-[80%] object-contain drop-shadow-[0_4px_24px_rgba(0,0,0,0.15)]"
      />
    </div>
  )
}

function isColorDark(hex: string): boolean {
  const c = hex.replace('#', '')
  if (c.length !== 6) return true
  const r = parseInt(c.substring(0, 2), 16)
  const g = parseInt(c.substring(2, 4), 16)
  const b = parseInt(c.substring(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance < 0.5
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
      <circle cx="100" cy="100" r="68" fill="#f4f4f5" />
      <circle cx="100" cy="100" r="60" fill={color} opacity="0.12" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
        <line
          key={a}
          x1="100" y1="100"
          x2={100 + Math.cos((a * Math.PI) / 180) * 55}
          y2={100 + Math.sin((a * Math.PI) / 180) * 55}
          stroke={color}
          strokeWidth="3"
          opacity="0.4"
        />
      ))}
      <circle cx="100" cy="100" r="22" fill={color} opacity="0.8" />
      <circle cx="100" cy="100" r="12" fill="#f4f4f5" />
      <circle cx="100" cy="100" r="5" fill={color} opacity="0.6" />
    </svg>
  )
}
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
    title: "PEÇAS RARAS",
    subtitle: "Encontre o que parecia impossível",
    tag: "Peças difíceis de encontrar? Aqui tem.",
    cta_text: "Ver catálogo",
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
    subtitle: "Parcele em até 6x sem juros",
    tag: "Válido em todo o site",
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
    subtitle: "Garantia de 30 dias — Envio nacional",
    tag: "Motor, freios, suspensão e mais",
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
  const [prev, setPrev] = useState<number | null>(null)
  const [animating, setAnimating] = useState(false)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    async function fetchBanners() {
      try {
        const res = await fetch('/api/admin/banners?active=true')
        if (res.ok) {
          const data = await res.json()
          if (data.banners?.length > 0) setSlides(data.banners)
        }
      } catch {}
    }
    fetchBanners()
  }, [])

  const goTo = useCallback((next: number) => {
    if (animating) return
    setPrev(current)
    setAnimating(true)
    setCurrent(next)
    setTimeout(() => {
      setPrev(null)
      setAnimating(false)
    }, 600)
  }, [current, animating])

  const goNext = useCallback(() => goTo((current + 1) % slides.length), [current, slides.length, goTo])
  const goPrev = useCallback(() => goTo((current - 1 + slides.length) % slides.length), [current, slides.length, goTo])

  useEffect(() => {
    if (paused) return
    const id = setInterval(goNext, 5500)
    return () => clearInterval(id)
  }, [paused, goNext])

  const slide = slides[current]
  if (!slide) return null

  const isDarkBg = isColorDark(slide.bg_color)

  return (
    <section
      aria-label="Banner promocional"
      className="relative w-full overflow-hidden"
      style={{ height: 'clamp(300px, 42vw, 480px)' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Slides stack — crossfade */}
      {slides.map((s, i) => {
        const isActive = i === current
        const isPrev = i === prev
        if (!isActive && !isPrev) return null

        return (
          <div
            key={s.id}
            className="absolute inset-0 w-full h-full"
            style={{
              opacity: isActive ? 1 : 0,
              transition: 'opacity 600ms ease-in-out',
              zIndex: isActive ? 2 : 1,
            }}
          >
            <SlideRenderer slide={s} />
          </div>
        )
      })}

      {/* Prev / Next */}
      <button
        onClick={goPrev}
        aria-label="Slide anterior"
        className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center rounded-full backdrop-blur-sm transition-all duration-200 hover:scale-110 cursor-pointer"
        style={{
          backgroundColor: isDarkBg ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
          color: isDarkBg ? '#fff' : '#18181b',
        }}
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        onClick={goNext}
        aria-label="Próximo slide"
        className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center rounded-full backdrop-blur-sm transition-all duration-200 hover:scale-110 cursor-pointer"
        style={{
          backgroundColor: isDarkBg ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
          color: isDarkBg ? '#fff' : '#18181b',
        }}
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2">
        {slides.map((s, i) => (
          <button
            key={s.id}
            aria-label={`Slide ${i + 1}`}
            onClick={() => goTo(i)}
            className="transition-all duration-300 rounded-full cursor-pointer"
            style={{
              width: i === current ? '24px' : '8px',
              height: '8px',
              backgroundColor: i === current
                ? slide.accent_color
                : isDarkBg ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.18)',
            }}
          />
        ))}
      </div>
    </section>
  )
}

function SlideRenderer({ slide }: { slide: BannerSlide }) {
  const hasDesktopImage = !!slide.desktop_image_url
  const ctaLink = slide.cta_link || '/loja'

  if (hasDesktopImage) {
    return (
      <>
        {/* Desktop: full AI image, clickable */}
        <a
          href={ctaLink}
          className="hidden md:block w-full h-full cursor-pointer"
          aria-label={slide.title}
        >
          <img
            src={slide.desktop_image_url!}
            alt={slide.title}
            className="w-full h-full object-cover"
          />
        </a>
        {/* Mobile: HTML layout */}
        <div
          className="md:hidden w-full h-full flex flex-col items-center justify-center gap-4 px-6 text-center"
          style={{ backgroundColor: slide.bg_color }}
        >
          <MobileSlideContent slide={slide} />
        </div>
      </>
    )
  }

  // HTML banner — both desktop and mobile
  return (
    <div
      className="w-full h-full flex items-center"
      style={{ backgroundColor: slide.bg_color }}
    >
      {/* Desktop */}
      <div className="hidden md:flex container mx-auto px-12 items-center gap-10 h-full">
        <HtmlSlideContent slide={slide} />
        <HtmlSlideImage slide={slide} />
      </div>
      {/* Mobile */}
      <div className="md:hidden w-full px-6 flex flex-col items-center gap-4 text-center">
        <MobileSlideContent slide={slide} />
      </div>
    </div>
  )
}

function HtmlSlideContent({ slide }: { slide: BannerSlide }) {
  return (
    <div className="flex-1 min-w-0">
      {slide.tag && (
        <span
          className="inline-flex items-center text-xs font-bold uppercase tracking-wider px-4 py-1.5 rounded-full mb-4"
          style={{ backgroundColor: slide.accent_color, color: '#fff' }}
        >
          {slide.tag}
        </span>
      )}
      <h2
        className="font-black leading-tight mb-3"
        style={{
          fontSize: 'clamp(1.6rem, 3.2vw, 2.6rem)',
          color: slide.text_color,
          fontFamily: 'Ubuntu, sans-serif',
        }}
      >
        {slide.title}
      </h2>
      {slide.subtitle && (
        <p className="text-base mb-6 opacity-70 max-w-sm" style={{ color: slide.text_color }}>
          {slide.subtitle}
        </p>
      )}
      <a
        href={slide.cta_link || '/loja'}
        className="inline-flex items-center gap-2 font-semibold text-sm px-7 py-3 rounded-lg transition-all duration-200 hover:opacity-90 cursor-pointer"
        style={{ backgroundColor: slide.accent_color, color: '#fff' }}
      >
        {slide.cta_text}
        <ChevronRight className="h-4 w-4" />
      </a>
    </div>
  )
}

function HtmlSlideImage({ slide }: { slide: BannerSlide }) {
  if (!slide.product_image_url) return (
    <div className="flex-shrink-0 w-64 h-64 opacity-40">
      <GearGraphic color={slide.accent_color} />
    </div>
  )

  return (
    <div className="flex-shrink-0 w-60 h-60 md:w-72 md:h-72 relative flex items-center justify-center">
      <div
        className="absolute inset-0 rounded-3xl"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.55) 55%, transparent 100%)',
        }}
      />
      <img
        src={slide.product_image_url}
        alt=""
        className="relative z-10 max-w-[78%] max-h-[78%] object-contain drop-shadow-lg"
      />
    </div>
  )
}

function MobileSlideContent({ slide }: { slide: BannerSlide }) {
  return (
    <>
      {slide.tag && (
        <span
          className="inline-flex items-center text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full"
          style={{ backgroundColor: slide.accent_color, color: '#fff' }}
        >
          {slide.tag}
        </span>
      )}
      <h2
        className="font-black leading-tight"
        style={{ fontSize: 'clamp(1.3rem, 5vw, 1.8rem)', color: slide.text_color, fontFamily: 'Ubuntu, sans-serif' }}
      >
        {slide.title}
      </h2>
      {slide.subtitle && (
        <p className="text-sm opacity-70" style={{ color: slide.text_color }}>{slide.subtitle}</p>
      )}
      {slide.product_image_url && (
        <div className="w-32 h-32 relative flex items-center justify-center">
          <div
            className="absolute inset-0 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.5) 60%, transparent 80%)' }}
          />
          <img src={slide.product_image_url} alt="" className="relative z-10 max-w-[75%] max-h-[75%] object-contain" />
        </div>
      )}
      <a
        href={slide.cta_link || '/loja'}
        className="inline-flex items-center gap-2 font-semibold text-sm px-6 py-2.5 rounded-lg transition-all duration-200 hover:opacity-90 cursor-pointer"
        style={{ backgroundColor: slide.accent_color, color: '#fff' }}
      >
        {slide.cta_text}
        <ChevronRight className="h-4 w-4" />
      </a>
    </>
  )
}

function isColorDark(hex: string): boolean {
  const c = hex.replace('#', '')
  if (c.length !== 6) return true
  const r = parseInt(c.substring(0, 2), 16)
  const g = parseInt(c.substring(2, 4), 16)
  const b = parseInt(c.substring(4, 6), 16)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.5
}

function GearGraphic({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full" aria-hidden="true">
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i * 30 * Math.PI) / 180
        const x = 100 + Math.cos(angle) * 82
        const y = 100 + Math.sin(angle) * 82
        return <rect key={i} x={x - 6} y={y - 10} width="12" height="20" rx="3" fill={color} opacity="0.8" transform={`rotate(${i * 30} ${x} ${y})`} />
      })}
      <circle cx="100" cy="100" r="72" fill={color} opacity="0.15" />
      <circle cx="100" cy="100" r="68" fill="#f4f4f5" />
      <circle cx="100" cy="100" r="22" fill={color} opacity="0.8" />
      <circle cx="100" cy="100" r="12" fill="#f4f4f5" />
    </svg>
  )
}

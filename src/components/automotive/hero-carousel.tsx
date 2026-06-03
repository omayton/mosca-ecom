"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react"

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
    title: "Peças Raras Encontradas",
    subtitle: "O que parecia impossível de achar, aqui você encontra.",
    tag: "Catálogo exclusivo",
    cta_text: "Ver catálogo",
    cta_link: "/loja",
    product_image_url: null,
    desktop_image_url: null,
    bg_color: "#0f0f11",
    accent_color: "#dc2626",
    text_color: "#ffffff",
  },
  {
    id: 2,
    title: "5% OFF no PIX",
    subtitle: "Parcele em até 6x sem juros no cartão.",
    tag: "Promoção",
    cta_text: "Aproveitar agora",
    cta_link: "/loja",
    product_image_url: null,
    desktop_image_url: null,
    bg_color: "#0a1a0f",
    accent_color: "#16a34a",
    text_color: "#ffffff",
  },
  {
    id: 3,
    title: "Envio para Todo o Brasil",
    subtitle: "Garantia de 30 dias em todos os produtos.",
    tag: "Frete nacional",
    cta_text: "Ver produtos",
    cta_link: "/loja",
    product_image_url: null,
    desktop_image_url: null,
    bg_color: "#0d0d14",
    accent_color: "#7c3aed",
    text_color: "#ffffff",
  },
]

const SLIDE_DURATION = 6000

export function HeroCarousel() {
  const [slides, setSlides] = useState<BannerSlide[]>(FALLBACK_SLIDES)
  const [current, setCurrent] = useState(0)
  const [prevIdx, setPrevIdx] = useState<number | null>(null)
  const [animating, setAnimating] = useState(false)
  const [paused, setPaused] = useState(false)
  const [progress, setProgress] = useState(0)
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const reducedMotion = useRef(false)

  useEffect(() => {
    reducedMotion.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    fetch('/api/admin/banners?active=true')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.banners?.length > 0) setSlides(d.banners) })
      .catch(() => {})
  }, [])

  const goTo = useCallback((next: number) => {
    if (animating) return
    setPrevIdx(current)
    setAnimating(true)
    setCurrent(next)
    setProgress(0)
    const duration = reducedMotion.current ? 0 : 500
    setTimeout(() => { setPrevIdx(null); setAnimating(false) }, duration)
  }, [current, animating])

  const goNext = useCallback(() => goTo((current + 1) % slides.length), [current, slides.length, goTo])
  const goPrev = useCallback(() => goTo((current - 1 + slides.length) % slides.length), [current, slides.length, goTo])

  // Auto-advance + progress bar
  useEffect(() => {
    if (paused) { setProgress(0); return }
    const step = 50
    const increment = (step / SLIDE_DURATION) * 100
    progressRef.current = setInterval(() => {
      setProgress(p => {
        if (p >= 100) { goNext(); return 0 }
        return p + increment
      })
    }, step)
    return () => { if (progressRef.current) clearInterval(progressRef.current) }
  }, [paused, goNext])

  const slide = slides[current]
  if (!slide) return null
  const isDark = isColorDark(slide.bg_color)

  return (
    <section
      aria-label="Banner promocional"
      className="relative w-full overflow-hidden"
      style={{ height: 'clamp(280px, 40vw, 480px)' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Slides — crossfade stack */}
      {slides.map((s, i) => {
        const isActive = i === current
        const isPrev = i === prevIdx
        if (!isActive && !isPrev) return null
        return (
          <div
            key={s.id}
            className="absolute inset-0"
            style={{
              opacity: isActive ? 1 : 0,
              transition: reducedMotion.current ? 'none' : 'opacity 500ms cubic-bezier(0.4,0,0.2,1)',
              zIndex: isActive ? 2 : 1,
            }}
          >
            <SlideRenderer slide={s} />
          </div>
        )
      })}

      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-[3px] z-20" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
        <div
          className="h-full"
          style={{
            width: `${progress}%`,
            backgroundColor: slide.accent_color,
            transition: paused ? 'none' : 'width 50ms linear',
          }}
        />
      </div>

      {/* Prev / Next */}
      <NavButton direction="prev" onClick={goPrev} isDark={isDark} />
      <NavButton direction="next" onClick={goNext} isDark={isDark} />

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2">
        {slides.map((s, i) => (
          <button
            key={s.id}
            aria-label={`Ir para slide ${i + 1}`}
            onClick={() => goTo(i)}
            className="cursor-pointer transition-all duration-300 rounded-full"
            style={{
              width: i === current ? '20px' : '6px',
              height: '6px',
              backgroundColor: i === current
                ? slide.accent_color
                : isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.2)',
            }}
          />
        ))}
      </div>
    </section>
  )
}

function NavButton({ direction, onClick, isDark }: { direction: 'prev' | 'next'; onClick: () => void; isDark: boolean }) {
  const isPrev = direction === 'prev'
  return (
    <button
      onClick={onClick}
      aria-label={isPrev ? 'Slide anterior' : 'Próximo slide'}
      className={`
        absolute top-1/2 -translate-y-1/2 z-10
        ${isPrev ? 'left-3 md:left-5' : 'right-3 md:right-5'}
        w-9 h-9 md:w-10 md:h-10 min-w-[44px] min-h-[44px]
        flex items-center justify-center rounded-full
        cursor-pointer transition-all duration-200
        hover:scale-110 active:scale-95
        backdrop-blur-md border
      `}
      style={{
        backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
        borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
        color: isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.7)',
      }}
    >
      {isPrev ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
    </button>
  )
}

function SlideRenderer({ slide }: { slide: BannerSlide }) {
  const hasDesktopImage = !!slide.desktop_image_url

  return (
    <div
      className="w-full h-full relative overflow-hidden"
      style={{ backgroundColor: slide.bg_color }}
    >
      {/* Desktop */}
      <div className="hidden md:flex w-full h-full items-center relative">
        {/* AI image as background — HTML overlays on top */}
        {hasDesktopImage && (
          <img
            src={slide.desktop_image_url!}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        <DesktopHtmlBanner slide={slide} hasBackground={hasDesktopImage} />
      </div>

      {/* Mobile */}
      <div className="md:hidden w-full h-full">
        <MobileLayout slide={slide} />
      </div>
    </div>
  )
}

function DesktopHtmlBanner({ slide, hasBackground = false }: { slide: BannerSlide; hasBackground?: boolean }) {
  const isDark = hasBackground ? true : isColorDark(slide.bg_color)
  const hasProduct = !!slide.product_image_url && !hasBackground
  const textColor = hasBackground ? '#ffffff' : slide.text_color

  return (
    <>
      {/* When AI background image: dark gradient on left so text is readable */}
      {hasBackground && (
        <div
          className="absolute inset-0 pointer-events-none z-[1]"
          style={{
            background: 'linear-gradient(90deg, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.65) 40%, rgba(0,0,0,0.15) 65%, transparent 80%)',
          }}
        />
      )}

      {/* Background glow behind product (HTML-only mode) */}
      {hasProduct && (
        <div
          className="absolute right-0 top-0 w-1/2 h-full pointer-events-none"
          style={{
            background: `radial-gradient(ellipse 60% 80% at 75% 50%, ${slide.accent_color}22 0%, transparent 70%)`,
          }}
        />
      )}

      {/* Subtle grid texture (HTML-only mode) */}
      {!hasBackground && (
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(${isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'} 1px, transparent 1px), linear-gradient(90deg, ${isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'} 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />
      )}

      <div className="relative z-10 w-full max-w-[1280px] mx-auto px-16 flex items-center gap-12 h-full">
        {/* Content */}
        <div className="flex-1 min-w-0 max-w-[520px]">
          {slide.tag && (
            <div className="flex items-center gap-2 mb-5">
              <span
                className="inline-flex items-center text-[11px] font-bold uppercase tracking-[0.12em] px-3 py-1.5 rounded-full"
                style={{ backgroundColor: `${slide.accent_color}22`, color: slide.accent_color, border: `1px solid ${slide.accent_color}44` }}
              >
                {slide.tag}
              </span>
            </div>
          )}

          <h2
            className="font-black leading-[1.1] mb-3 tracking-tight"
            style={{
              fontSize: 'clamp(1.2rem, 2.1vw, 1.9rem)',
              color: textColor,
              fontFamily: 'Ubuntu, sans-serif',
              textShadow: isDark ? '0 2px 20px rgba(0,0,0,0.5)' : 'none',
            }}
          >
            {slide.title}
          </h2>

          {slide.subtitle && (
            <p
              className="text-[13px] leading-relaxed mb-6 max-w-[380px]"
              style={{ color: textColor, opacity: 0.75 }}
            >
              {slide.subtitle}
            </p>
          )}

          <a
            href={slide.cta_link || '/loja'}
            className="inline-flex items-center gap-2 font-semibold text-sm px-5 py-3 rounded-xl transition-all duration-200 hover:brightness-110 hover:shadow-lg active:scale-95 cursor-pointer min-h-[44px]"
            style={{
              backgroundColor: slide.accent_color,
              color: '#fff',
              boxShadow: `0 4px 24px ${slide.accent_color}44`,
            }}
          >
            {slide.cta_text}
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>

        {/* Product image — float on background, no container */}
        {hasProduct && (
          <div
            className="flex-shrink-0 relative flex items-center justify-center"
            style={{ width: 'clamp(220px, 28vw, 360px)', height: 'clamp(220px, 28vw, 360px)' }}
          >
            {/* Accent glow behind product */}
            <div
              className="absolute inset-8 blur-3xl opacity-30 rounded-full"
              style={{ backgroundColor: slide.accent_color }}
            />
            <img
              src={slide.product_image_url!}
              alt=""
              className="relative z-10 object-contain"
              style={{
                maxWidth: '85%',
                maxHeight: '85%',
                filter: 'drop-shadow(0 8px 40px rgba(0,0,0,0.7))',
              }}
            />
          </div>
        )}
      </div>

      {/* Bottom accent line */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[2px]"
        style={{ background: `linear-gradient(90deg, transparent, ${slide.accent_color}66, transparent)` }}
      />
    </>
  )
}

function MobileLayout({ slide }: { slide: BannerSlide }) {
  const hasDesktopImage = !!slide.desktop_image_url

  // Banner AI no mobile: usa a imagem como fundo + texto sobreposto
  if (hasDesktopImage) {
    return (
      <div className="w-full h-full relative overflow-hidden flex items-center px-5 gap-3">
        <img src={slide.desktop_image_url!} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover" />
        {/* Gradiente escuro à esquerda para legibilidade */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.6) 50%, rgba(0,0,0,0.1) 100%)' }} />
        <div className="relative z-10 flex flex-col gap-2">
          {slide.tag && (
            <span className="self-start text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full"
              style={{ backgroundColor: `${slide.accent_color}30`, color: slide.accent_color, border: `1px solid ${slide.accent_color}55` }}>
              {slide.tag}
            </span>
          )}
          <h2 className="font-black leading-tight text-white"
            style={{ fontSize: 'clamp(0.9rem, 4vw, 1.2rem)', fontFamily: 'Ubuntu, sans-serif' }}>
            {slide.title}
          </h2>
          {slide.subtitle && (
            <p className="text-[10px] text-white/55 leading-snug">{slide.subtitle}</p>
          )}
          <a href={slide.cta_link || '/loja'}
            className="self-start inline-flex items-center gap-1.5 font-semibold text-[11px] px-4 py-2 rounded-lg cursor-pointer min-h-[40px] transition-all mt-1"
            style={{ backgroundColor: slide.accent_color, color: '#fff' }}>
            {slide.cta_text} <ArrowRight className="h-3 w-3" />
          </a>
        </div>
      </div>
    )
  }

  const textColor = slide.text_color || '#ffffff'

  return (
    <div className="w-full h-full flex items-center relative overflow-hidden px-5 gap-3">
      {/* Background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at 80% 50%, ${slide.accent_color}30 0%, transparent 65%)` }}
      />

      {/* Left: text */}
      <div className="relative z-10 flex-1 min-w-0 flex flex-col gap-2.5">
        {slide.tag && (
          <span
            className="self-start text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full"
            style={{ backgroundColor: `${slide.accent_color}25`, color: slide.accent_color, border: `1px solid ${slide.accent_color}50` }}
          >
            {slide.tag}
          </span>
        )}
        <h2
          className="font-black leading-tight"
          style={{ fontSize: 'clamp(0.95rem, 4.5vw, 1.3rem)', color: textColor, fontFamily: 'Ubuntu, sans-serif' }}
        >
          {slide.title}
        </h2>
        {slide.subtitle && (
          <p className="text-[11px] leading-snug" style={{ color: textColor, opacity: 0.55 }}>
            {slide.subtitle}
          </p>
        )}
        <a
          href={slide.cta_link || '/loja'}
          className="self-start inline-flex items-center gap-1.5 font-semibold text-[11px] px-4 py-2.5 rounded-lg cursor-pointer min-h-[40px] transition-all duration-200 hover:brightness-110 mt-1"
          style={{ backgroundColor: slide.accent_color, color: '#fff' }}
        >
          {slide.cta_text} <ArrowRight className="h-3 w-3" />
        </a>
      </div>

      {/* Right: product */}
      {slide.product_image_url && (
        <div className="relative z-10 flex-shrink-0 flex items-center justify-center" style={{ width: '42%', height: '85%' }}>
          <div
            className="absolute inset-4 blur-2xl opacity-25 rounded-full"
            style={{ backgroundColor: slide.accent_color }}
          />
          <img
            src={slide.product_image_url}
            alt=""
            className="relative z-10 object-contain w-full h-full"
            style={{ filter: 'drop-shadow(0 4px 20px rgba(0,0,0,0.7))' }}
          />
        </div>
      )}
    </div>
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

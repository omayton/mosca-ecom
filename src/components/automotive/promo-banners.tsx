const BANNERS = [
  {
    href: "#",
    bg: "bg-gradient-to-r from-zinc-900 via-zinc-800 to-green-950",
    ctaClass: "bg-green-600 hover:bg-green-700",
    eyebrow: "Aproveite — válido em todo o site",
    title: "5% OFF",
    subtitle: "pagando com PIX",
    footnote: "* Desconto aplicado automaticamente no checkout",
    cta: "Ver ofertas",
    shapes: [
      { size: "w-20 h-20", rotate: "-rotate-12", pos: "top-3 right-28", opacity: "opacity-20", color: "bg-green-500" },
      { size: "w-12 h-12", rotate: "rotate-6",  pos: "bottom-4 right-10", opacity: "opacity-15", color: "bg-green-400" },
      { size: "w-8  h-8",  rotate: "rotate-0",  pos: "top-6 right-10", opacity: "opacity-10", color: "bg-white" },
    ],
  },
  {
    href: "#",
    bg: "bg-gradient-to-r from-zinc-900 via-zinc-800 to-red-950/40",
    ctaClass: "bg-red-600 hover:bg-red-700",
    eyebrow: "Peças raras, soluções únicas",
    title: "PARCELAMOS",
    subtitle: "em até 3x sem juros",
    footnote: "Garantia de devolução em 30 dias",
    cta: "COMPRE AGORA",
    shapes: [
      { size: "w-24 h-24", rotate: "rotate-12",  pos: "top-2 right-20", opacity: "opacity-15", color: "bg-red-600" },
      { size: "w-10 h-10", rotate: "-rotate-6",  pos: "bottom-3 right-8", opacity: "opacity-10", color: "bg-red-400" },
      { size: "w-6  h-6",  rotate: "rotate-0",   pos: "top-8 right-6",  opacity: "opacity-10", color: "bg-white" },
    ],
  },
]

export function PromoBanners() {
  return (
    <section aria-label="Banners promocionais" className="bg-zinc-950 py-4">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {BANNERS.map((b) => (
            <a
              key={b.title}
              href={b.href}
              className={`relative ${b.bg} overflow-hidden flex items-center min-h-[160px] px-8 py-6 group`}
              aria-label={`${b.title} — ${b.cta}`}
            >
              {/* Decorative shapes */}
              {b.shapes.map((s, i) => (
                <div key={i} aria-hidden="true" className={`absolute ${s.pos} ${s.size} ${s.rotate} ${s.opacity} ${s.color} rounded-lg`} />
              ))}

              {/* Text */}
              <div className="relative z-10">
                <p className="text-white/60 font-inter text-xs uppercase tracking-widest mb-1">{b.eyebrow}</p>
                <h3 className="font-barlow font-black text-white leading-none mb-1" style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}>
                  {b.title}
                </h3>
                <p className="text-white/80 font-inter text-base font-semibold mb-1">{b.subtitle}</p>
                <p className="text-white/40 font-inter text-xs mb-4">{b.footnote}</p>
                <span className={`inline-block ${b.ctaClass} text-white font-inter font-bold text-sm px-5 py-2.5 min-h-[44px] transition-colors duration-200 flex items-center`}>
                  {b.cta}
                </span>
              </div>

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors duration-300" aria-hidden="true" />
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}

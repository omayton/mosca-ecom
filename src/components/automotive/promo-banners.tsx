import { Zap, CreditCard, Truck, Shield } from "lucide-react"

const BANNERS = [
  {
    href: "/loja",
    icon: Zap,
    gradient: "from-emerald-600 to-emerald-800",
    iconBg: "bg-emerald-400/20",
    title: "5% OFF NO PIX",
    subtitle: "Desconto aplicado automaticamente",
    cta: "Aproveitar",
    ctaClass: "bg-white text-emerald-800 hover:bg-emerald-50",
  },
  {
    href: "/loja",
    icon: CreditCard,
    gradient: "from-zinc-800 to-zinc-950",
    iconBg: "bg-white/10",
    title: "ATÉ 6X SEM JUROS",
    subtitle: "Parcele no cartão de crédito",
    cta: "Comprar agora",
    ctaClass: "bg-red-600 text-white hover:bg-red-700",
  },
  {
    href: "/loja",
    icon: Truck,
    gradient: "from-blue-700 to-blue-900",
    iconBg: "bg-blue-400/20",
    title: "ENVIO NACIONAL",
    subtitle: "Correios e transportadora para todo Brasil",
    cta: "Ver produtos",
    ctaClass: "bg-white text-blue-800 hover:bg-blue-50",
  },
  {
    href: "/sobre",
    icon: Shield,
    gradient: "from-amber-600 to-amber-800",
    iconBg: "bg-amber-300/20",
    title: "GARANTIA 30 DIAS",
    subtitle: "Devolução sem burocracia",
    cta: "Saiba mais",
    ctaClass: "bg-white text-amber-800 hover:bg-amber-50",
  },
]

export function PromoBanners() {
  return (
    <section aria-label="Benefícios" className="bg-[#FAFAFA] py-10">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {BANNERS.map((b) => {
            const Icon = b.icon
            return (
              <a
                key={b.title}
                href={b.href}
                className={`relative bg-gradient-to-br ${b.gradient} overflow-hidden flex flex-col items-start p-6 group rounded-2xl transition-all duration-300 hover:shadow-xl hover:scale-[1.02]`}
                aria-label={`${b.title} — ${b.cta}`}
              >
                {/* Icon */}
                <div className={`w-10 h-10 ${b.iconBg} rounded-xl flex items-center justify-center mb-4`}>
                  <Icon className="h-5 w-5 text-white" aria-hidden="true" />
                </div>

                {/* Text */}
                <h3 className="font-black text-white text-base leading-tight mb-1">
                  {b.title}
                </h3>
                <p className="text-white/60 text-xs mb-4 leading-relaxed">
                  {b.subtitle}
                </p>

                {/* CTA */}
                <span className={`mt-auto inline-block ${b.ctaClass} font-semibold text-xs px-4 py-2 rounded-lg transition-all duration-200`}>
                  {b.cta}
                </span>

                {/* Decorative circle */}
                <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/5 rounded-full" aria-hidden="true" />
                <div className="absolute -top-4 -right-4 w-16 h-16 bg-white/5 rounded-full" aria-hidden="true" />
              </a>
            )
          })}
        </div>
      </div>
    </section>
  )
}

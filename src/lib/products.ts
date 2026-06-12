export interface Product {
  id: number
  slug: string
  name: string
  price: number
  oldPrice?: number
  category: string
  categorySlug: string
  imageFile: string
  description: string
  weight?: string
  dimensions?: string
  inStock: boolean
  featured: boolean
  stockQuantity?: number
  stockThreshold?: number
  stockStatus?: 'available' | 'low_stock' | 'out_of_stock' | 'discontinued'
}

// Images served locally from /public/images/04/ (downloaded from WordPress)
// No hotlink issues — 100% self-hosted on Vercel CDN.
export const LOCAL_IMG  = "/images/04/"
export const WP_IMG     = "https://www.moscabrancaparts.com.br/wp-content/uploads/2026/04/" // fallback
export const PLACEHOLDER = "/images/placeholder-product.svg"

export function imgUrl(file: string): string {
  if (!file || file === "placeholder") return PLACEHOLDER
  // Full URL (Supabase Storage or external) — use as-is
  if (file.startsWith("http")) return file
  // Legacy WordPress filename — serve from local /public/images/04/
  if (file.trim()) return `${LOCAL_IMG}${file}`
  return PLACEHOLDER
}

export function pixPrice(price: number): number {
  return Math.round(price * 0.95 * 100) / 100
}

export function installmentPrice(price: number, n = 3): number {
  return Math.round((price / n) * 100) / 100
}

export function fmt(n: number): string {
  return n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export const PRODUCTS: Product[] = [
  {
    id: 1,
    slug: "par-le-ld-botao-comando-de-som-do-volante-vectra",
    name: "(PAR-LE/LD) Botão Comando de Som do Volante Vectra",
    price: 110.00,
    category: "Interruptores e Botões", categorySlug: "interruptores-e-botoes",
    imageFile: "br-11134207-81z1k-mf3xr9g9m6me0c-400x400.jpg",
    description: "Par de botões de comando de som do volante (lado esquerdo e direito) para Vectra. Peça rara de difícil localização no mercado nacional. Encaixe original, sem necessidade de adaptações.",
    weight: "0,1 kg", dimensions: "18×15×18 cm", inStock: true, featured: true,
  },
  {
    id: 2,
    slug: "02-capas-dos-bracos-do-limpa-para-brisas-vw",
    name: "02 Capas dos Braços do Limpa Para-brisas VW Gol Saveiro Voyage Parati",
    price: 30.00,
    category: "Limpadores", categorySlug: "limpadores",
    imageFile: "br-11134207-81z1k-mfch2h2tut5109-400x400.jpg",
    description: "Kit com 2 capas protetoras dos braços do limpa para-brisas para VW Gol, Saveiro, Voyage e Parati. Produto original, acabamento perfeito.",
    weight: "0,05 kg", inStock: true, featured: false,
  },
  {
    id: 3,
    slug: "2-bucha-batente-sensor-interruptor-pedal-freio",
    name: "2 Bucha Batente Sensor Interruptor Luz Pedal Freio Accord Civic Fit CRV City",
    price: 23.00,
    category: "Freios", categorySlug: "freios",
    imageFile: "br-11134207-81z1k-mf8bkc48rmro0b-3-400x400.jpg",
    description: "Kit com 2 buchas de batente do sensor/interruptor de luz do pedal de freio. Compatível com Honda Accord, Civic, Fit, CR-V e City. Restaura o funcionamento correto das luzes de freio.",
    weight: "0,03 kg", inStock: true, featured: true,
  },
  {
    id: 4,
    slug: "2-patins-guia-do-teto-solar-fiat-stilo",
    name: "2 Patins Guia Do Teto Solar Fiat Stilo 2003/2011",
    price: 39.90,
    category: "Teto Solar", categorySlug: "teto-solar",
    imageFile: "br-11134207-81z1k-mf3cjcmux34438-1-400x400.jpg",
    description: "Kit com 2 patins guia do teto solar para Fiat Stilo 2003 a 2011. Peça essencial para o correto deslizamento do teto solar. Original e raramente encontrada.",
    weight: "0,08 kg", inStock: true, featured: true,
  },
  {
    id: 5,
    slug: "2-pino-trava-porta-fusca-gol-voyage-parati",
    name: "2 Pino Trava Porta Fusca Brasília Variant Gol Quadrado Voyage Parati Saveiro",
    price: 10.00,
    category: "Fechaduras", categorySlug: "fechaduras",
    imageFile: "br-11134207-81z1k-merjvwgmscg01a-400x400.jpg",
    description: "Kit com 2 pinos de trava de porta para Fusca, Brasília, Variant, Gol quadrado, Voyage, Parati e Saveiro. Produto de reposição original.",
    weight: "0,02 kg", inStock: true, featured: false,
  },
  {
    id: 6,
    slug: "adaptador-suporte-bobina-r8-vw-audi-1-8t",
    name: "Adaptador Suporte Bobina R8 TSI TFSI Volkswagen Audi 1.8T",
    price: 48.00,
    category: "Motor", categorySlug: "motor",
    imageFile: "br-11134207-81z1k-miaae1wck8htca-1-400x400.jpg",
    description: "Adaptador suporte para bobina de ignição R8 em motores VW/Audi 1.8T TSI e TFSI. Permite o uso de bobinas de alta performance sem modificações estruturais.",
    weight: "0,12 kg", inStock: true, featured: true,
  },
  {
    id: 7,
    slug: "alavanca-ajuste-banco-ford-new-fiesta-focus-motorista",
    name: "Alavanca De Ajuste De Banco Ford New Fiesta Ford Focus 2013-2019 Motorista",
    price: 50.00,
    category: "Banco e Assento", categorySlug: "banco-e-assento",
    imageFile: "br-11134207-81z1k-meiifmwn1atedb-400x400.jpg",
    description: "Alavanca de ajuste do banco do motorista para Ford New Fiesta e Ford Focus entre 2013 e 2019. Restaura a funcionalidade do ajuste de posição do assento.",
    weight: "0,09 kg", inStock: true, featured: false,
  },
  {
    id: 8,
    slug: "alavanca-regulagem-banco-peugeot-206-207-motorista",
    name: "Alavanca de Regulagem do Banco Peugeot 206 207 Motorista",
    price: 59.00,
    category: "Banco e Assento", categorySlug: "banco-e-assento",
    imageFile: "br-11134207-81z1k-mg84hl83yby812-2-400x400.jpg",
    description: "Alavanca de regulagem do banco do motorista para Peugeot 206 e 207. Peça de reposição que restaura a funcionalidade de ajuste longitudinal do assento.",
    weight: "0,11 kg", inStock: true, featured: false,
  },
  {
    id: 9,
    slug: "alavanca-regulagem-banco-peugeot-206-207-passageiro",
    name: "Alavanca de Regulagem do Banco Peugeot 206 207 Passageiro",
    price: 59.00,
    category: "Banco e Assento", categorySlug: "banco-e-assento",
    imageFile: "br-11134207-81z1k-mg84hl83yby812-1-400x400.jpg",
    description: "Alavanca de regulagem do banco do passageiro para Peugeot 206 e 207. Idêntica à do motorista, porém para o lado do passageiro.",
    weight: "0,11 kg", inStock: true, featured: false,
  },
  {
    id: 10,
    slug: "alavanca-regulagem-encosto-banco-universal",
    name: "Alavanca de Regulagem do Encosto do Banco – Modelo Universal",
    price: 70.90,
    category: "Banco e Assento", categorySlug: "banco-e-assento",
    imageFile: "IMG_5282-scaled-1-400x300.webp",
    description: "Alavanca de regulagem de encosto do banco, modelo universal compatível com diversas marcas e modelos. Verifique a compatibilidade antes de comprar.",
    weight: "0,15 kg", inStock: true, featured: true,
  },
  {
    id: 11,
    slug: "alca-ajuste-assento-banco-vw-amarok-jetta-golf",
    name: "Alça Ajuste Assento Banco VW Amarok Jetta Golf Passat Audi",
    price: 22.00,
    category: "Banco e Assento", categorySlug: "banco-e-assento",
    imageFile: "br-11134207-81z1k-mflasvsyuk933b-400x400.jpg",
    description: "Alça de ajuste do assento do banco para VW Amarok, Jetta, Golf, Passat e Audi. Peça plástica de reposição com encaixe original.",
    weight: "0,04 kg", inStock: true, featured: false,
  },
  {
    id: 12,
    slug: "anel-borracha-maquina-vidro-vw-fusca",
    name: "Anel de Borracha da Máquina de Vidro – VW Fusca",
    price: 20.00,
    category: "Vedações", categorySlug: "vedacoes",
    imageFile: "sg-11134201-824h5-me5nx2wv553552-1-400x400.jpg",
    description: "Anel de borracha de vedação da máquina de vidro para VW Fusca. Evita a entrada de água e poeira no mecanismo do vidro elétrico/manual.",
    weight: "0,02 kg", inStock: true, featured: false,
  },
  {
    id: 13,
    slug: "anel-cebolao-radiador-kit-10",
    name: "Anel do Cebolão do Radiador VW Fiat GM Ford (Kit com 10)",
    price: 20.00,
    category: "Motor", categorySlug: "motor",
    imageFile: "br-11134207-81z1k-metaxw4binsz30-400x400.jpg",
    description: "Kit com 10 anéis de borracha do cebolão do radiador. Compatível com VW, Fiat, GM e Ford. Evita vazamentos no sistema de arrefecimento.",
    weight: "0,03 kg", inStock: true, featured: false,
  },
  {
    id: 14,
    slug: "arremate-acabamento-friso-porta-gol-voyage",
    name: "Arremate Acabamento Friso Porta Do Gol Voyage Quadrado Par",
    price: 40.00,
    category: "Tampas e Acabamentos", categorySlug: "tampas-e-acabamentos",
    imageFile: "br-11134207-81z1k-mfcid6cr81dw5d-1-400x400.jpg",
    description: "Par de arremates de acabamento do friso da porta para Gol e Voyage quadrado (1ª e 2ª geração). Restitui a estética original do veículo.",
    weight: "0,07 kg", inStock: true, featured: false,
  },
  {
    id: 15,
    slug: "bloco-condensador-distribuidor-vectra-astra",
    name: "Bloco Condensador do Distribuidor – Chevrolet Vectra/Astra/Omega",
    price: 249.00,
    category: "Motor", categorySlug: "motor",
    imageFile: "vec1-400x400.png",
    description: "Bloco condensador do distribuidor para Chevrolet Vectra, Astra e Omega até 1996. Peça técnica de alta complexidade e raridade. Solução definitiva para falhas no sistema de ignição.",
    weight: "0,3 kg", dimensions: "15×12×8 cm", inStock: true, featured: true,
  },
  {
    id: 16,
    slug: "borracha-vedacao-base-antena-teto",
    name: "Borracha de Vedação da Base da Antena de Teto",
    price: 60.00,
    category: "Vedações", categorySlug: "vedacoes",
    imageFile: "br-11134207-81z1k-mfb35vx06l1hcb-400x400.jpg",
    description: "Borracha de vedação da base da antena de teto para Gol GTI quadrado (1ª geração). Elimina vazamentos de água pelo furo da antena.",
    weight: "0,04 kg", inStock: true, featured: false,
  },
  {
    id: 17,
    slug: "botao-alavanca-cambio-automatico-ford-focus",
    name: "Botão Alavanca Do Câmbio Automático Ford Focus Ecosport",
    price: 60.00,
    category: "Câmbio", categorySlug: "cambio",
    imageFile: "br-11134207-81z1k-mf404hn4ov7q2e-1-400x400.jpg",
    description: "Botão de acionamento da alavanca do câmbio automático para Ford Focus e Ecosport. Restaura a funcionalidade e aparência original da alavanca de câmbio.",
    weight: "0,05 kg", inStock: true, featured: true,
  },
  {
    id: 18,
    slug: "botao-alavanca-cambio-automatico-honda-civic",
    name: "Botão Alavanca Do Câmbio Automático Honda Civic",
    price: 95.00,
    category: "Câmbio", categorySlug: "cambio",
    imageFile: "br-11134207-81z1k-mf8bkc49026ce3-400x400.jpg",
    description: "Botão de acionamento da alavanca do câmbio automático para Honda Civic. Acabamento original, encaixe perfeito sem adaptações.",
    weight: "0,06 kg", inStock: true, featured: false,
  },
  {
    id: 19,
    slug: "alavanca-regulagem-banco-peugeot-par",
    name: "Alavanca de Regulagem do Banco Peugeot 206 207 Motorista e Passageiro",
    price: 130.00,
    category: "Banco e Assento", categorySlug: "banco-e-assento",
    imageFile: "placeholder",
    description: "Par completo (motorista + passageiro) de alavancas de regulagem do banco para Peugeot 206 e 207. Ideal para quem precisa trocar os dois lados.",
    weight: "0,22 kg", inStock: true, featured: false,
  },
  {
    id: 20,
    slug: "adaptador-led-h1-farol-astra",
    name: "Adaptador para Lâmpadas de LED H1 e H7 Farol Astra H1",
    price: 10.00,
    oldPrice: 34.90,
    category: "Iluminação", categorySlug: "iluminacao",
    imageFile: "placeholder",
    description: "Adaptador para instalação de lâmpadas LED H1 no farol do Astra. Permite o uso de lâmpadas de LED sem modificações no farol original.",
    weight: "0,02 kg", inStock: true, featured: false,
  },
]

export function parseWeight(w?: string): number {
  if (!w) return 0.3
  const n = parseFloat(w.replace(",", "."))
  return isNaN(n) ? 0.3 : n
}

export function parseDimensions(d?: string): { width: number; height: number; length: number } {
  if (!d) return { width: 16, height: 10, length: 10 }
  const parts = d.replace(/\s*cm\s*/i, "").split(/[×x]/i).map((s) => parseFloat(s.trim()))
  if (parts.length >= 3 && parts.every((n) => !isNaN(n))) {
    return { width: parts[0], height: parts[1], length: parts[2] }
  }
  return { width: 16, height: 10, length: 10 }
}

export function getProductBySlug(slug: string): Product | undefined {
  return PRODUCTS.find((p) => p.slug === slug)
}

export function getRelated(product: Product, limit = 4): Product[] {
  return PRODUCTS
    .filter((p) => p.id !== product.id && p.categorySlug === product.categorySlug)
    .slice(0, limit)
    .concat(
      PRODUCTS.filter((p) => p.id !== product.id && p.categorySlug !== product.categorySlug).slice(0, Math.max(0, limit - PRODUCTS.filter((p) => p.id !== product.id && p.categorySlug === product.categorySlug).length))
    )
    .slice(0, limit)
}

export const FEATURED = PRODUCTS.filter((p) => p.featured)
export const RECENT   = [...PRODUCTS].slice(-8)

import { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { Clock, ArrowRight, Newspaper } from "lucide-react"
import { TopHeader } from "@/components/automotive/top-header"
import { getPublishedPosts } from "@/lib/blog-db"

export const revalidate = 600

export const metadata: Metadata = {
  title: "Blog — Dicas e Notícias Automotivas | Mosca Branca Parts",
  description:
    "Artigos, dicas de manutenção e notícias do mundo automotivo. Conteúdo autoral da Mosca Branca Parts sobre peças, cuidados com o carro e mercado de autopeças.",
  alternates: { canonical: "https://www.moscabrancaparts.com.br/blog" },
  openGraph: {
    type: "website",
    url: "https://www.moscabrancaparts.com.br/blog",
    title: "Blog — Dicas e Notícias Automotivas | Mosca Branca Parts",
    description: "Artigos e dicas do mundo automotivo. Conteúdo autoral da Mosca Branca Parts.",
  },
}

function fmtDate(iso: string | null) {
  if (!iso) return ""
  try {
    return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })
  } catch {
    return ""
  }
}

export default async function BlogPage() {
  const posts = await getPublishedPosts(30)

  const [featured, ...rest] = posts

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <TopHeader />

      {/* Header */}
      <section className="bg-zinc-950 text-white">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-400 mb-3">
              <Newspaper className="h-4 w-4" /> Blog Mosca Branca
            </span>
            <h1 className="font-bold text-3xl md:text-4xl leading-tight mb-3">
              Dicas e notícias do mundo automotivo
            </h1>
            <p className="text-white/60 text-base">
              Conteúdo autoral sobre manutenção, peças raras e cuidados com o seu carro.
            </p>
          </div>
        </div>
      </section>

      <main className="container mx-auto px-4 py-10 md:py-14">
        {posts.length === 0 ? (
          <div className="text-center py-20">
            <Newspaper className="h-12 w-12 text-zinc-300 mx-auto mb-4" />
            <p className="text-zinc-500">Em breve novos artigos por aqui.</p>
            <Link href="/" className="inline-flex items-center gap-2 mt-6 text-red-600 font-medium hover:text-red-700">
              Voltar à loja <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="max-w-5xl mx-auto">
            {/* Featured */}
            {featured && (
              <Link
                href={`/blog/${featured.slug}`}
                className="group block bg-white border border-zinc-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 mb-8"
              >
                <div className="grid md:grid-cols-2">
                  <div className="relative aspect-[16/10] md:aspect-auto bg-zinc-100 overflow-hidden">
                    {featured.coverImageUrl ? (
                      <Image
                        src={featured.coverImageUrl}
                        alt={featured.title}
                        fill
                        priority
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-zinc-300">
                        <Newspaper className="h-12 w-12" />
                      </div>
                    )}
                  </div>
                  <div className="p-6 md:p-8 flex flex-col justify-center">
                    {featured.category && (
                      <span className="text-xs font-bold uppercase tracking-wider text-red-600 mb-2">{featured.category}</span>
                    )}
                    <h2 className="font-bold text-xl md:text-2xl text-zinc-900 leading-tight mb-3 group-hover:text-red-700 transition-colors">
                      {featured.title}
                    </h2>
                    <p className="text-zinc-600 text-sm leading-relaxed line-clamp-3 mb-4">{featured.excerpt}</p>
                    <div className="flex items-center gap-3 text-xs text-zinc-400">
                      <span>{featured.author}</span>
                      <span>•</span>
                      <span>{fmtDate(featured.publishedAt)}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {featured.readingMinutes} min</span>
                    </div>
                  </div>
                </div>
              </Link>
            )}

            {/* Grid */}
            {rest.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rest.map((p) => (
                  <Link
                    key={p.id}
                    href={`/blog/${p.slug}`}
                    className="group flex flex-col bg-white border border-zinc-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:border-red-100 transition-all duration-300"
                  >
                    <div className="relative aspect-[16/10] bg-zinc-100 overflow-hidden">
                      {p.coverImageUrl ? (
                        <Image
                          src={p.coverImageUrl}
                          alt={p.title}
                          fill
                          sizes="(max-width: 768px) 100vw, 33vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-zinc-300">
                          <Newspaper className="h-10 w-10" />
                        </div>
                      )}
                    </div>
                    <div className="p-5 flex flex-col flex-1">
                      {p.category && (
                        <span className="text-[11px] font-bold uppercase tracking-wider text-red-600 mb-1.5">{p.category}</span>
                      )}
                      <h3 className="font-semibold text-zinc-900 leading-snug mb-2 group-hover:text-red-700 transition-colors line-clamp-2">
                        {p.title}
                      </h3>
                      <p className="text-zinc-500 text-sm leading-relaxed line-clamp-2 mb-3 flex-1">{p.excerpt}</p>
                      <div className="flex items-center gap-2 text-xs text-zinc-400">
                        <span>{fmtDate(p.publishedAt)}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {p.readingMinutes} min</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

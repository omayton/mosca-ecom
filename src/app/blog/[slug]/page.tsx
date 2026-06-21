import { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { notFound } from "next/navigation"
import { Clock, ArrowLeft, ArrowRight, ChevronRight, Newspaper } from "lucide-react"
import { TopHeader } from "@/components/automotive/top-header"
import { getPostBySlug, getRelatedPosts, getAllBlogSlugs } from "@/lib/blog-db"
import { renderMarkdown } from "@/lib/markdown"

export const revalidate = 600

const BASE = "https://www.moscabrancaparts.com.br"

function fmtDate(iso: string | null) {
  if (!iso) return ""
  try {
    return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })
  } catch {
    return ""
  }
}

export async function generateStaticParams() {
  const slugs = await getAllBlogSlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = await getPostBySlug(params.slug)
  if (!post) return {}

  const url = `${BASE}/blog/${post.slug}`
  const title = post.metaTitle || post.title
  const description = post.metaDescription || post.excerpt || `${post.title} — Blog Mosca Branca Parts.`
  const image = post.coverImageUrl || undefined

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title,
      description,
      images: image ? [{ url: image, alt: post.title }] : undefined,
      publishedTime: post.publishedAt || undefined,
      authors: [post.author],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : undefined,
    },
  }
}

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  const post = await getPostBySlug(params.slug)
  if (!post) notFound()

  const related = await getRelatedPosts(post.category, post.slug, 3)
  const url = `${BASE}/blog/${post.slug}`
  const articleHtml = renderMarkdown(post.content)

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Schema.org Article */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: post.title,
            description: post.metaDescription || post.excerpt || undefined,
            image: post.coverImageUrl ? [post.coverImageUrl] : undefined,
            datePublished: post.publishedAt || undefined,
            dateModified: post.updatedAt,
            author: { "@type": "Organization", name: post.author },
            publisher: {
              "@type": "Organization",
              name: "Mosca Branca Parts",
              logo: { "@type": "ImageObject", url: `${BASE}/images/05/bannermosca.png` },
            },
            mainEntityOfPage: { "@type": "WebPage", "@id": url },
          }),
        }}
      />

      {/* Schema.org BreadcrumbList */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Início", item: BASE },
              { "@type": "ListItem", position: 2, name: "Blog", item: `${BASE}/blog` },
              { "@type": "ListItem", position: 3, name: post.title, item: url },
            ],
          }),
        }}
      />

      <TopHeader />

      {/* Breadcrumb */}
      <nav aria-label="Localização" className="bg-white/80 border-b border-zinc-100 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-3 flex items-center gap-2 text-xs text-zinc-500 flex-wrap">
          <Link href="/" className="hover:text-red-600 transition-colors">Início</Link>
          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          <Link href="/blog" className="hover:text-red-600 transition-colors">Blog</Link>
          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="text-zinc-800 font-medium line-clamp-1">{post.title}</span>
        </div>
      </nav>

      <article className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-3xl mx-auto">
          {/* Back */}
          <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-red-600 transition-colors mb-6">
            <ArrowLeft className="h-4 w-4" /> Todos os artigos
          </Link>

          {/* Header */}
          <header className="mb-8">
            {post.category && (
              <span className="text-xs font-bold uppercase tracking-wider text-red-600 mb-3 block">{post.category}</span>
            )}
            <h1 className="font-bold text-3xl md:text-4xl text-zinc-900 leading-tight mb-4">{post.title}</h1>
            {post.excerpt && <p className="text-lg text-zinc-600 leading-relaxed mb-4">{post.excerpt}</p>}
            <div className="flex items-center gap-3 text-sm text-zinc-400 flex-wrap">
              <span className="font-medium text-zinc-600">{post.author}</span>
              <span>•</span>
              <span>{fmtDate(post.publishedAt)}</span>
              <span>•</span>
              <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {post.readingMinutes} min de leitura</span>
            </div>
          </header>

          {/* Cover */}
          {post.coverImageUrl && (
            <div className="relative aspect-[16/9] rounded-2xl overflow-hidden mb-8 bg-zinc-100">
              <Image
                src={post.coverImageUrl}
                alt={post.title}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 768px"
                className="object-cover"
              />
            </div>
          )}

          {/* Content */}
          <div
            className="prose-blog text-zinc-700 leading-relaxed space-y-1 [&_p]:my-4 [&_p]:text-[17px] [&_li]:text-[17px] [&_a]:text-red-600 [&_a]:underline [&_img]:rounded-xl [&_img]:my-6 [&_img]:w-full"
            dangerouslySetInnerHTML={{ __html: articleHtml }}
          />

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-8 pt-8 border-t border-zinc-100">
              {post.tags.map((t) => (
                <span key={t} className="text-xs bg-zinc-100 text-zinc-600 px-3 py-1 rounded-full">#{t}</span>
              ))}
            </div>
          )}

          {/* CTA */}
          <div className="mt-10 p-6 bg-zinc-950 rounded-2xl text-center">
            <p className="text-white font-bold text-lg mb-1">Precisando de peças?</p>
            <p className="text-white/60 text-sm mb-4">Encontre peças raras e de difícil localização com envio para todo Brasil.</p>
            <Link href="/loja" className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-sm px-6 py-3 rounded-xl transition-colors">
              Ver produtos <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </article>

      {/* Related */}
      {related.length > 0 && (
        <section className="bg-white border-t border-zinc-100 py-12 mt-4">
          <div className="container mx-auto px-4 max-w-5xl">
            <h2 className="font-bold text-zinc-900 text-xl mb-6">Continue lendo</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {related.map((p) => (
                <Link key={p.id} href={`/blog/${p.slug}`} className="group flex flex-col bg-zinc-50 rounded-xl overflow-hidden hover:shadow-md transition-all duration-300">
                  <div className="relative aspect-[16/10] bg-zinc-100">
                    {p.coverImageUrl ? (
                      <Image src={p.coverImageUrl} alt={p.title} fill sizes="33vw" className="object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-zinc-300"><Newspaper className="h-8 w-8" /></div>
                    )}
                  </div>
                  <div className="p-4">
                    {p.category && <span className="text-[11px] font-bold uppercase tracking-wider text-red-600">{p.category}</span>}
                    <h3 className="font-semibold text-zinc-900 leading-snug mt-1 line-clamp-2 group-hover:text-red-700 transition-colors">{p.title}</h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

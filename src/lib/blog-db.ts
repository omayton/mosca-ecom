import { supabase } from "./supabase"

export interface BlogPost {
  id: number
  slug: string
  title: string
  excerpt: string | null
  content: string
  coverImageUrl: string | null
  author: string
  category: string | null
  tags: string[]
  readingMinutes: number
  metaTitle: string | null
  metaDescription: string | null
  isPublished: boolean
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}

interface BlogRow {
  id: number
  slug: string
  title: string
  excerpt: string | null
  content: string
  cover_image_url: string | null
  author: string
  category: string | null
  tags: string[] | null
  reading_minutes: number | null
  meta_title: string | null
  meta_description: string | null
  is_published: boolean
  published_at: string | null
  created_at: string
  updated_at: string
}

function rowToPost(row: BlogRow): BlogPost {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    content: row.content || "",
    coverImageUrl: row.cover_image_url,
    author: row.author || "Equipe Mosca Branca Parts",
    category: row.category,
    tags: row.tags || [],
    readingMinutes: row.reading_minutes || 3,
    metaTitle: row.meta_title,
    metaDescription: row.meta_description,
    isPublished: row.is_published,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

// Lista pública (publicados), resumo (sem content para lista).
export async function getPublishedPosts(limit = 20): Promise<BlogPost[]> {
  const { data, error } = await supabase
    .from("blog_posts")
    .select("id, slug, title, excerpt, cover_image_url, author, category, tags, reading_minutes, is_published, published_at, created_at, updated_at")
    .eq("is_published", true)
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(limit)

  if (error || !data) return []
  return (data as BlogRow[]).map(rowToPost)
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle()

  if (error || !data) return null
  return rowToPost(data as BlogRow)
}

export async function getRelatedPosts(category: string | null, excludeSlug: string, limit = 3): Promise<BlogPost[]> {
  let query = supabase
    .from("blog_posts")
    .select("id, slug, title, excerpt, cover_image_url, author, category, tags, reading_minutes, is_published, published_at, created_at, updated_at")
    .eq("is_published", true)
    .neq("slug", excludeSlug)
    .limit(limit)

  if (category) query = query.eq("category", category)

  const { data, error } = await query
  if (error || !data) return []
  return (data as BlogRow[]).map(rowToPost)
}

export async function getAllBlogSlugs(): Promise<string[]> {
  const { data, error } = await supabase
    .from("blog_posts")
    .select("slug")
    .eq("is_published", true)

  if (error || !data) return []
  return (data as { slug: string }[]).map((r) => r.slug)
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80)
}

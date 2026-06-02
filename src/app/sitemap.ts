import { MetadataRoute } from "next"
import { supabase } from "@/lib/supabase"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://www.moscabrancaparts.com.br"

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/loja`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/sobre`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/politica-de-privacidade`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${baseUrl}/termos-de-uso`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
  ]

  // Product pages
  const { data: products } = await supabase
    .from("products")
    .select("slug, updated_at")
    .eq("status", "available")
    .order("id")

  const productPages: MetadataRoute.Sitemap = (products || []).map((p: any) => ({
    url: `${baseUrl}/produto/${p.slug}`,
    lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }))

  // Category pages
  const { data: categories } = await supabase
    .from("categories")
    .select("slug")
    .eq("is_active", true)

  const categoryPages: MetadataRoute.Sitemap = (categories || []).map((c: any) => ({
    url: `${baseUrl}/loja?categoria=${c.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }))

  return [...staticPages, ...productPages, ...categoryPages]
}

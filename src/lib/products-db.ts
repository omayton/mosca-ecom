import { supabase } from "./supabase"
import { Product } from "./products"

interface ProductRow {
  id: number
  slug: string
  name: string
  price: number
  old_price: number | null
  category: string
  category_slug: string
  image_file: string
  description: string | null
  weight: string | null
  dimensions: string | null
  in_stock: boolean
  featured: boolean
}

function rowToProduct(row: ProductRow): Product {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    price: row.price,
    oldPrice: row.old_price ?? undefined,
    category: row.category,
    categorySlug: row.category_slug,
    imageFile: row.image_file,
    description: row.description ?? "",
    weight: row.weight ?? undefined,
    dimensions: row.dimensions ?? undefined,
    inStock: row.in_stock,
    featured: row.featured,
  }
}

export async function getProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("id")

  if (error) throw error
  return (data as ProductRow[]).map(rowToProduct)
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .single()

  if (error) {
    if (error.code === "PGRST116") return null
    throw error
  }
  return rowToProduct(data as ProductRow)
}

export async function getFeaturedProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("featured", true)
    .order("id")

  if (error) throw error
  return (data as ProductRow[]).map(rowToProduct)
}

export async function getRecentProducts(limit = 8): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("id", { ascending: false })
    .limit(limit)

  if (error) throw error
  return (data as ProductRow[]).map(rowToProduct)
}

export async function getRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
  const { data: sameCategory, error: err1 } = await supabase
    .from("products")
    .select("*")
    .eq("category_slug", product.categorySlug)
    .neq("id", product.id)
    .limit(limit)

  if (err1) throw err1

  const sameCatProducts = (sameCategory as ProductRow[]).map(rowToProduct)

  if (sameCatProducts.length >= limit) {
    return sameCatProducts.slice(0, limit)
  }

  const remaining = limit - sameCatProducts.length
  const excludeIds = [product.id, ...sameCatProducts.map((p) => p.id)]

  const { data: others, error: err2 } = await supabase
    .from("products")
    .select("*")
    .not("id", "in", `(${excludeIds.join(",")})`)
    .limit(remaining)

  if (err2) throw err2

  return [...sameCatProducts, ...(others as ProductRow[]).map(rowToProduct)]
}

export async function getAllSlugs(): Promise<string[]> {
  const { data, error } = await supabase
    .from("products")
    .select("slug")

  if (error) throw error
  return (data as { slug: string }[]).map((r) => r.slug)
}

export interface ProductImage {
  id: number
  url: string
  altText: string
  sortOrder: number
}

export async function getProductImages(productId: number): Promise<ProductImage[]> {
  const { data, error } = await supabase
    .from("product_images")
    .select("id, url, alt_text, sort_order")
    .eq("product_id", productId)
    .order("sort_order")

  if (error) return []
  return (data || []).map((row: { id: number; url: string; alt_text: string; sort_order: number }) => ({
    id: row.id,
    url: row.url,
    altText: row.alt_text,
    sortOrder: row.sort_order,
  }))
}

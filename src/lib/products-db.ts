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

async function getProductMainImageURL(productId: number): Promise<string> {
  const mainImage = await getMainProductImage(productId)
  return mainImage?.url || ""
}

// Batch fetch main images for multiple products in a single query (avoids N+1).
// Returns a map of productId -> image url.
async function getMainImageURLsForProducts(productIds: number[]): Promise<Record<number, string>> {
  if (productIds.length === 0) return {}
  const { data, error } = await supabase
    .from("product_images")
    .select("product_id, url")
    .in("product_id", productIds)
    .eq("sort_order", 0)

  if (error || !data) return {}
  const map: Record<number, string> = {}
  for (const row of data) {
    // First occurrence wins (sort_order=0 may have dupes; take the earliest by id)
    if (!map[row.product_id]) map[row.product_id] = row.url
  }
  return map
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
    imageFile: row.image_file, // Mantido para compatibilidade, mas será substituído
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
  return applyFlashSale((data as ProductRow[]).map(rowToProduct))
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

  const product = rowToProduct(data as ProductRow)

  // Buscar imagem principal
  const mainImageURL = await getProductMainImageURL(product.id)
  const withImage = mainImageURL ? { ...product, imageFile: mainImageURL } : product

  // Aplica desconto da oferta relâmpago ativa (se o produto participar)
  const { product: priced } = await applyFlashSaleToProduct(withImage)
  return priced
}

export async function getFeaturedProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("featured", true)
    .order("id")

  if (error) throw error
  const products = (data as ProductRow[]).map(rowToProduct)

  // Buscar imagens principais em batch (1 query, não N+1)
  const imageMap = await getMainImageURLsForProducts(products.map((p) => p.id))
  return applyFlashSale(products.map((p) => ({ ...p, imageFile: imageMap[p.id] || p.imageFile })))
}

export async function getRecentProducts(limit = 12): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("id", { ascending: false })
    .limit(limit)

  if (error) throw error
  const products = (data as ProductRow[]).map(rowToProduct)

  const imageMap = await getMainImageURLsForProducts(products.map((p) => p.id))
  return applyFlashSale(products.map((p) => ({ ...p, imageFile: imageMap[p.id] || p.imageFile })))
}

export async function getDiscountProducts(limit = 12): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .not("old_price", "is", null)
    .order("id", { ascending: false })
    .limit(limit)

  if (error) throw error
  const products = (data as ProductRow[]).map(rowToProduct)

  const imageMap = await getMainImageURLsForProducts(products.map((p) => p.id))
  return applyFlashSale(products.map((p) => ({ ...p, imageFile: imageMap[p.id] || p.imageFile })))
}

export async function getBestSellers(limit = 8): Promise<Product[]> {
  // Count quantities sold from order_items, group by product
  const { data: salesData, error: salesError } = await supabase
    .from("order_items")
    .select("product_id, quantity")
    .not("product_id", "is", null)

  if (salesError || !salesData || salesData.length === 0) {
    // Fallback: return featured products
    return getFeaturedProducts()
  }

  const salesMap: Record<number, number> = {}
  for (const item of salesData) {
    if (item.product_id) {
      salesMap[item.product_id] = (salesMap[item.product_id] || 0) + (item.quantity || 1)
    }
  }

  // Sort product IDs by total sold
  const sortedIds = Object.entries(salesMap)
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => Number(id))
    .slice(0, limit)

  if (sortedIds.length === 0) return getFeaturedProducts()

  // Fetch products in ranking order
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .in("id", sortedIds)

  if (error) throw error
  const products = (data as ProductRow[]).map(rowToProduct)

  // Sort by sales rank
  products.sort((a, b) => (salesMap[b.id] || 0) - (salesMap[a.id] || 0))

  const imageMap = await getMainImageURLsForProducts(products.map((p) => p.id))
  return applyFlashSale(products.map((p) => ({ ...p, imageFile: imageMap[p.id] || p.imageFile })))
}

export async function getProductReviewStats(productId: number): Promise<{ count: number; avgRating: number }> {
  const { data, error } = await supabase
    .from("product_reviews")
    .select("rating")
    .eq("product_id", productId)
    .eq("is_approved", true)

  if (error || !data || data.length === 0) return { count: 0, avgRating: 0 }
  const sum = data.reduce((acc: number, r: { rating: number }) => acc + r.rating, 0)
  return {
    count: data.length,
    avgRating: Math.round((sum / data.length) * 10) / 10,
  }
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

  return applyFlashSale([...sameCatProducts, ...(others as ProductRow[]).map(rowToProduct)])
}

// ──────────────────────────────────────────────────────────────
// Oferta Relâmpago (Flash Sale)
// ──────────────────────────────────────────────────────────────

export interface ActiveFlashSale {
  id: number
  title: string
  description: string | null
  discountPercent: number
  startsAt: string
  endsAt: string
  productIds: Set<number>
}

// Cache de 30s para evitar bater no banco a cada fetch de produto.
let flashSaleCache: { data: ActiveFlashSale | null; expires: number } | null = null
const FLASH_SALE_TTL = 30_000

export async function getActiveFlashSale(): Promise<ActiveFlashSale | null> {
  if (flashSaleCache && flashSaleCache.expires > Date.now()) {
    return flashSaleCache.data
  }

  try {
    const nowIso = new Date().toISOString()
    // Campanha ativa = ligada E dentro da janela (início ≤ agora ≤ fim).
    // Pega a que termina mais cedo (maior urgência no countdown).
    const { data: sale, error } = await supabase
      .from("flash_sales")
      .select("id, title, description, starts_at, ends_at, discount_percent")
      .eq("is_active", true)
      .lte("starts_at", nowIso)
      .gte("ends_at", nowIso)
      .order("ends_at", { ascending: true })
      .limit(1)
      .maybeSingle()

    if (error || !sale) {
      flashSaleCache = { data: null, expires: Date.now() + FLASH_SALE_TTL }
      return null
    }

    const { data: rows } = await supabase
      .from("flash_sale_products")
      .select("product_id")
      .eq("flash_sale_id", sale.id)

    const result: ActiveFlashSale = {
      id: sale.id,
      title: sale.title,
      description: sale.description,
      discountPercent: Number(sale.discount_percent) || 0,
      startsAt: sale.starts_at,
      endsAt: sale.ends_at,
      productIds: new Set((rows || []).map((r: { product_id: number }) => r.product_id)),
    }

    flashSaleCache = { data: result, expires: Date.now() + FLASH_SALE_TTL }
    return result
  } catch {
    flashSaleCache = { data: null, expires: Date.now() + FLASH_SALE_TTL }
    return null
  }
}

// Aplica o desconto da oferta relâmpago a uma lista de produtos.
// O preço original vira oldPrice (se ainda não existir); price vira o com desconto.
export async function applyFlashSale(products: Product[]): Promise<Product[]> {
  const fs = await getActiveFlashSale()
  if (!fs || fs.productIds.size === 0 || products.length === 0) return products
  return products.map((p) => {
    if (!fs.productIds.has(p.id)) return p
    const discounted = Math.round(p.price * (1 - fs.discountPercent / 100) * 100) / 100
    return { ...p, oldPrice: p.oldPrice || p.price, price: discounted }
  })
}

export async function applyFlashSaleToProduct(product: Product): Promise<{ product: Product; onFlashSale: boolean; flashSale: ActiveFlashSale | null }> {
  const fs = await getActiveFlashSale()
  if (!fs || !fs.productIds.has(product.id)) {
    return { product, onFlashSale: false, flashSale: fs }
  }
  const discounted = Math.round(product.price * (1 - fs.discountPercent / 100) * 100) / 100
  return {
    product: { ...product, oldPrice: product.oldPrice || product.price, price: discounted },
    onFlashSale: true,
    flashSale: fs,
  }
}

export async function getAllSlugs(): Promise<string[]> {
  // Guard: if Supabase URL not configured (e.g. local build without .env.local),
  // fall back to the static product list so generateStaticParams doesn't crash.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const { PRODUCTS } = await import("./products")
    return PRODUCTS.map((p) => p.slug)
  }

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

export async function getMainProductImage(productId: number): Promise<ProductImage | null> {
  const { data, error } = await supabase
    .from("product_images")
    .select("id, url, alt_text, sort_order")
    .eq("product_id", productId)
    .eq("sort_order", 0)
    .limit(1)
    .single()

  if (error || !data) return null
  return {
    id: data.id,
    url: data.url,
    altText: data.alt_text || "",
    sortOrder: data.sort_order,
  }
}

export async function addProductImage(
  productId: number,
  url: string,
  altText: string = "",
  sortOrder: number = 0
): Promise<ProductImage | null> {
  const { data, error } = await supabase
    .from("product_images")
    .insert({ product_id: productId, url, alt_text: altText, sort_order: sortOrder })
    .select("id, url, alt_text, sort_order")
    .single()

  if (error) {
    console.error("Erro ao adicionar imagem:", error)
    return null
  }

  return {
    id: data.id,
    url: data.url,
    altText: data.alt_text || "",
    sortOrder: data.sort_order,
  }
}

export async function updateProductImage(
  imageId: number,
  updates: { altText?: string; sortOrder?: number }
): Promise<boolean> {
  const updateData: any = {}
  if (updates.altText !== undefined) updateData.alt_text = updates.altText
  if (updates.sortOrder !== undefined) updateData.sort_order = updates.sortOrder

  const { error } = await supabase
    .from("product_images")
    .update(updateData)
    .eq("id", imageId)

  return !error
}

export async function deleteProductImage(imageId: number): Promise<boolean> {
  const { error } = await supabase
    .from("product_images")
    .delete()
    .eq("id", imageId)

  return !error
}

export async function reorderProductImages(
  productId: number,
  imageOrders: { id: number; sortOrder: number }[]
): Promise<boolean> {
  const updates = imageOrders.map(({ id, sortOrder }) =>
    supabase.from("product_images").update({ sort_order: sortOrder }).eq("id", id)
  )

  const results = await Promise.all(updates)
  return results.every((r) => !r.error)
}

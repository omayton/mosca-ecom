import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Pública: retorna a oferta relâmpago ativa + produtos participantes (já com
// preço descontado), para o banner countdown e seção de produtos na home.
export async function GET() {
  try {
    const supabase = getSupabase()
    const nowIso = new Date().toISOString()

    const { data: sale, error } = await supabase
      .from('flash_sales')
      .select('id, title, description, starts_at, ends_at, discount_percent')
      .eq('is_active', true)
      .lte('starts_at', nowIso)
      .gte('ends_at', nowIso)
      .order('ends_at', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (error || !sale) {
      return NextResponse.json({ active: false })
    }

    const { data: rows } = await supabase
      .from('flash_sale_products')
      .select('product_id')
      .eq('flash_sale_id', sale.id)

    const productIds = (rows || []).map((r: { product_id: number }) => r.product_id)
    const discount = Number(sale.discount_percent) || 0

    let products: any[] = []
    if (productIds.length > 0) {
      const { data: prods } = await supabase
        .from('products')
        .select('id, slug, name, price, old_price, image_file, in_stock')
        .in('id', productIds)
        .eq('in_stock', true)

      products = (prods || []).map((p: any) => {
        const discounted = Math.round(p.price * (1 - discount / 100) * 100) / 100
        return {
          id: p.id,
          slug: p.slug,
          name: p.name,
          imageFile: p.image_file,
          inStock: p.in_stock,
          originalPrice: p.price,
          price: discounted,
          oldPrice: p.old_price ?? p.price,
        }
      })
    }

    return NextResponse.json({
      active: true,
      flashSale: {
        id: sale.id,
        title: sale.title,
        description: sale.description,
        discountPercent: discount,
        startsAt: sale.starts_at,
        endsAt: sale.ends_at,
      },
      products,
    })
  } catch (error) {
    console.error('Active flash sale error:', error)
    return NextResponse.json({ active: false })
  }
}

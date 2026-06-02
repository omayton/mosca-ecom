import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { auditLog } from '@/lib/audit-log'
import { getClientIp } from '@/lib/rate-limit'
import { requireAdmin } from '@/lib/require-admin'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(req: NextRequest) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const status = searchParams.get('status') || ''

    const supabase = getSupabase()
    const offset = (page - 1) * limit

    let query = supabase
      .from('products')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (search) {
      query = query.ilike('name', `%${search}%`)
    }
    if (category) {
      query = query.eq('category_slug', category)
    }
    if (status) {
      query = query.eq('status', status)
    }

    const { data, error, count } = await query

    if (error) throw error

    return NextResponse.json({
      products: data,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    })
  } catch (error) {
    console.error('Products fetch error:', error)
    return NextResponse.json({ error: 'Erro ao buscar produtos.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  try {
    const body = await req.json()
    const supabase = getSupabase()

    const { data, error } = await supabase
      .from('products')
      .insert({
        slug: body.slug,
        name: body.name,
        price: body.price,
        old_price: body.oldPrice || null,
        category: body.category,
        category_slug: body.categorySlug,
        image_file: body.imageFile || 'placeholder',
        description: body.description || '',
        weight: body.weight || null,
        dimensions: body.dimensions || null,
        in_stock: body.stockQuantity > 0,
        featured: body.featured || false,
        stock_quantity: body.stockQuantity || 999,
        stock_threshold: body.stockThreshold || 10,
        status: 'available'
      })
      .select()
      .single()

    if (error) throw error

    await auditLog({ action: 'product.create', entityType: 'product', entityId: String(data.id), details: { name: body.name }, ipAddress: getClientIp(req.headers) })

    return NextResponse.json({ success: true, product: data })
  } catch (error) {
    console.error('Product create error:', error)
    return NextResponse.json({ error: 'Erro ao criar produto.' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  try {
    const body = await req.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'ID do produto é obrigatório.' }, { status: 400 })
    }

    const supabase = getSupabase()

    const dbUpdates: any = {}
    if (updates.name !== undefined) dbUpdates.name = updates.name
    if (updates.slug !== undefined) dbUpdates.slug = updates.slug
    if (updates.price !== undefined) dbUpdates.price = updates.price
    if (updates.oldPrice !== undefined) dbUpdates.old_price = updates.oldPrice
    if (updates.category !== undefined) dbUpdates.category = updates.category
    if (updates.categorySlug !== undefined) dbUpdates.category_slug = updates.categorySlug
    if (updates.imageFile !== undefined) dbUpdates.image_file = updates.imageFile
    if (updates.description !== undefined) dbUpdates.description = updates.description
    if (updates.weight !== undefined) dbUpdates.weight = updates.weight
    if (updates.dimensions !== undefined) dbUpdates.dimensions = updates.dimensions
    if (updates.featured !== undefined) dbUpdates.featured = updates.featured
    if (updates.stockQuantity !== undefined) {
      dbUpdates.stock_quantity = updates.stockQuantity
      dbUpdates.in_stock = updates.stockQuantity > 0
    }
    if (updates.stockThreshold !== undefined) dbUpdates.stock_threshold = updates.stockThreshold
    if (updates.status !== undefined) dbUpdates.status = updates.status

    const { data, error } = await supabase
      .from('products')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, product: data })
  } catch (error) {
    console.error('Product update error:', error)
    return NextResponse.json({ error: 'Erro ao atualizar produto.' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID do produto é obrigatório.' }, { status: 400 })
    }

    const supabase = getSupabase()

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)

    if (error) throw error

    await auditLog({ action: 'product.delete', entityType: 'product', entityId: id, ipAddress: getClientIp(req.headers) })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Product delete error:', error)
    return NextResponse.json({ error: 'Erro ao deletar produto.' }, { status: 500 })
  }
}
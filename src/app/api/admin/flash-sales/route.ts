import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/require-admin'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// GET — lista campanhas (com contagem) OU detalhe de uma (?id=X com productIds)
export async function GET(req: NextRequest) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  const supabase = getSupabase()

  // Detalhe de uma campanha para edição
  if (id) {
    const { data: sale, error } = await supabase
      .from('flash_sales')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    if (error) return NextResponse.json({ error: 'Erro ao buscar oferta.' }, { status: 500 })
    if (!sale) return NextResponse.json({ error: 'Oferta não encontrada.' }, { status: 404 })

    const { data: rows } = await supabase
      .from('flash_sale_products')
      .select('product_id')
      .eq('flash_sale_id', id)
    return NextResponse.json({ flashSale: { ...sale, productIds: (rows || []).map((r: any) => r.product_id) } })
  }

  try {
    const { data, error } = await supabase
      .from('flash_sales')
      .select('*')
      .order('starts_at', { ascending: false })

    if (error) throw error

    // Conta produtos por campanha
    const sales = data || []
    const ids = sales.map((s: any) => s.id)
    let countMap: Record<number, number> = {}
    if (ids.length > 0) {
      const { data: rows } = await supabase
        .from('flash_sale_products')
        .select('flash_sale_id')
        .in('flash_sale_id', ids)
      if (rows) {
        for (const r of rows) {
          countMap[r.flash_sale_id] = (countMap[r.flash_sale_id] || 0) + 1
        }
      }
    }

    const result = sales.map((s: any) => ({
      ...s,
      productCount: countMap[s.id] || 0,
    }))

    return NextResponse.json({ flashSales: result })
  } catch (error) {
    console.error('Flash sales GET error:', error)
    return NextResponse.json({ error: 'Erro ao buscar ofertas.' }, { status: 500 })
  }
}

// POST — cria nova campanha
export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  try {
    const body = await req.json()
    const { title, description, startsAt, endsAt, discountPercent, productIds } = body

    if (!title || !startsAt || !endsAt) {
      return NextResponse.json({ error: 'Título, início e fim são obrigatórios.' }, { status: 400 })
    }
    if (new Date(endsAt) <= new Date(startsAt)) {
      return NextResponse.json({ error: 'A data de fim deve ser depois do início.' }, { status: 400 })
    }
    const discount = Number(discountPercent)
    if (Number.isNaN(discount) || discount < 0 || discount > 100) {
      return NextResponse.json({ error: 'Desconto inválido (0–100).' }, { status: 400 })
    }

    const supabase = getSupabase()

    const { data: sale, error } = await supabase
      .from('flash_sales')
      .insert({
        title,
        description: description || null,
        starts_at: startsAt,
        ends_at: endsAt,
        discount_percent: discount,
        is_active: true,
      })
      .select()
      .single()

    if (error || !sale) {
      return NextResponse.json({ error: 'Erro ao criar oferta.' }, { status: 500 })
    }

    // Vincula produtos
    const ids: number[] = Array.isArray(productIds) ? productIds.filter((id: any) => id) : []
    if (ids.length > 0) {
      const rows = ids.map((pid: number) => ({ flash_sale_id: sale.id, product_id: pid }))
      await supabase.from('flash_sale_products').insert(rows)
    }

    return NextResponse.json({ success: true, flashSale: sale })
  } catch (error) {
    console.error('Flash sales POST error:', error)
    return NextResponse.json({ error: 'Erro ao criar oferta.' }, { status: 500 })
  }
}

// PATCH — atualiza campanha (e produtos, se enviados) ou alterna is_active
export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  try {
    const body = await req.json()
    const { id, title, description, startsAt, endsAt, discountPercent, productIds, isActive } = body

    if (!id) {
      return NextResponse.json({ error: 'ID obrigatório.' }, { status: 400 })
    }

    const supabase = getSupabase()

    const updates: any = {}
    if (title !== undefined) updates.title = title
    if (description !== undefined) updates.description = description
    if (startsAt !== undefined) updates.starts_at = startsAt
    if (endsAt !== undefined) updates.ends_at = endsAt
    if (discountPercent !== undefined) {
      const d = Number(discountPercent)
      if (Number.isNaN(d) || d < 0 || d > 100) {
        return NextResponse.json({ error: 'Desconto inválido.' }, { status: 400 })
      }
      updates.discount_percent = d
    }
    if (isActive !== undefined) updates.is_active = !!isActive

    if (startsAt && endsAt && new Date(endsAt) <= new Date(startsAt)) {
      return NextResponse.json({ error: 'A data de fim deve ser depois do início.' }, { status: 400 })
    }

    if (Object.keys(updates).length > 0) {
      const { error } = await supabase.from('flash_sales').update(updates).eq('id', id)
      if (error) throw error
    }

    // Recria vínculos de produtos se enviado
    if (Array.isArray(productIds)) {
      await supabase.from('flash_sale_products').delete().eq('flash_sale_id', id)
      const ids: number[] = productIds.filter((pid: any) => pid)
      if (ids.length > 0) {
        const rows = ids.map((pid: number) => ({ flash_sale_id: id, product_id: pid }))
        await supabase.from('flash_sale_products').insert(rows)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Flash sales PATCH error:', error)
    return NextResponse.json({ error: 'Erro ao atualizar oferta.' }, { status: 500 })
  }
}

// DELETE — remove campanha (cascade remove vínculos)
export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'ID obrigatório.' }, { status: 400 })
    }

    const supabase = getSupabase()
    const { error } = await supabase.from('flash_sales').delete().eq('id', id)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Flash sales DELETE error:', error)
    return NextResponse.json({ error: 'Erro ao excluir oferta.' }, { status: 500 })
  }
}

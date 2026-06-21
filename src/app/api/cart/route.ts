import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function getUser(cookieStore: ReturnType<typeof cookies>) {
  const accessToken = cookieStore.get('sb-access-token')?.value
  if (!accessToken) return null

  const authClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${accessToken}` } }, auth: { persistSession: false } }
  )
  const { data: { user } } = await authClient.auth.getUser(accessToken)
  return user
}

export async function GET() {
  try {
    const cookieStore = cookies()
    const user = await getUser(cookieStore)
    if (!user) {
      return NextResponse.json({ items: [] })
    }

    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('cart_items')
      .select('product_id, quantity, products(name, price, image_file, slug, weight, dimensions)')
      .eq('user_id', user.id)

    if (error) throw error

    const items = (data || []).map((row: any) => ({
      productId: row.product_id,
      quantity: row.quantity,
      name: row.products?.name || '',
      price: row.products?.price || 0,
      imageFile: row.products?.image_file || '',
      slug: row.products?.slug || '',
      weight: row.products?.weight || undefined,
      dimensions: row.products?.dimensions || undefined,
    }))

    return NextResponse.json({ items })
  } catch (error) {
    console.error('Cart GET error:', error)
    return NextResponse.json({ items: [] })
  }
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = cookies()
    const user = await getUser(cookieStore)
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { items } = await req.json()
    if (!Array.isArray(items)) {
      return NextResponse.json({ error: 'items deve ser um array' }, { status: 400 })
    }

    const supabase = getSupabase()

    // Fetch existing items to preserve their first_added_at timestamps
    const { data: existing } = await supabase
      .from('cart_items')
      .select('product_id, first_added_at')
      .eq('user_id', user.id)

    const existingMap = new Map(
      (existing || []).map((e: any) => [e.product_id, e.first_added_at])
    )

    const newProductIds = items.map((i: { productId: number }) => i.productId)

    // Delete items removed from the cart
    const removedIds = Array.from(existingMap.keys()).filter((id) => !newProductIds.includes(id))
    if (removedIds.length > 0) {
      await supabase.from('cart_items').delete()
        .eq('user_id', user.id)
        .in('product_id', removedIds)
    }

    // Upsert: INSERT new with timestamp, UPDATE existing quantity + updated_at
    const nowIso = new Date().toISOString()
    if (items.length > 0) {
      const rows = items.map((item: { productId: number; quantity: number }) => ({
        user_id: user.id,
        product_id: item.productId,
        quantity: item.quantity,
        // Preserve original timestamp for existing items; set now() for new ones
        first_added_at: existingMap.get(item.productId) ?? nowIso,
        // Always refresh updated_at on a real cart change (last activity).
        // Set explicitly so we don't depend on a DB trigger existing.
        updated_at: nowIso,
      }))

      const { error } = await supabase.from('cart_items').upsert(rows, {
        onConflict: 'user_id,product_id',
      })
      if (error) throw error
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Cart POST error:', error)
    // Retorna o erro real do Supabase (code + message) para diagnóstico no client
    return NextResponse.json(
      { error: error?.message || 'Erro ao sincronizar carrinho', code: error?.code },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  try {
    const cookieStore = cookies()
    const user = await getUser(cookieStore)
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const supabase = getSupabase()
    await supabase.from('cart_items').delete().eq('user_id', user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Cart DELETE error:', error)
    return NextResponse.json({ error: 'Erro ao limpar carrinho' }, { status: 500 })
  }
}

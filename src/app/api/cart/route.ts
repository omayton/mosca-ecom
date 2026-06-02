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
      .select('product_id, quantity, products(name, price, image_file, slug)')
      .eq('user_id', user.id)

    if (error) throw error

    const items = (data || []).map((row: any) => ({
      productId: row.product_id,
      quantity: row.quantity,
      name: row.products?.name || '',
      price: row.products?.price || 0,
      imageFile: row.products?.image_file || '',
      slug: row.products?.slug || '',
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

    // Delete existing items for this user
    await supabase.from('cart_items').delete().eq('user_id', user.id)

    // Insert new items
    if (items.length > 0) {
      const rows = items.map((item: { productId: number; quantity: number }) => ({
        user_id: user.id,
        product_id: item.productId,
        quantity: item.quantity,
      }))

      const { error } = await supabase.from('cart_items').insert(rows)
      if (error) throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Cart POST error:', error)
    return NextResponse.json({ error: 'Erro ao sincronizar carrinho' }, { status: 500 })
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

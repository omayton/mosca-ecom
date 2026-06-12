import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/require-admin'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  const orderId = parseInt(params.id)
  if (isNaN(orderId)) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
  }

  try {
    const supabase = getSupabase()

    // Fetch order
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (orderErr || !order) {
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 })
    }

    // Fetch order items with product info
    const { data: items } = await supabase
      .from('order_items')
      .select('*, products(name, image_file, slug, category)')
      .eq('order_id', orderId)

    // Fetch customer profile
    let customer = { name: 'Cliente', email: '', phone: '' }
    if (order.user_id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('name, full_name, phone, email')
        .eq('id', order.user_id)
        .single()

      // Also get email from auth.users
      const { data: authUser } = await supabase.auth.admin.getUserById(order.user_id)

      customer = {
        name: profile?.name || profile?.full_name || authUser?.user?.user_metadata?.name || 'Cliente',
        email: profile?.email || authUser?.user?.email || '',
        phone: profile?.phone || order.address_json?.telefone || '',
      }
    }

    return NextResponse.json({
      order: {
        ...order,
        customer,
        items: (items || []).map((item: any) => ({
          id: item.id,
          productId: item.product_id,
          name: item.products?.name || 'Produto',
          imageFile: item.products?.image_file || '',
          slug: item.products?.slug || '',
          category: item.products?.category || '',
          quantity: item.quantity,
          unitPrice: item.unit_price,
          total: item.unit_price * item.quantity,
        })),
      }
    })
  } catch (err: any) {
    console.error('[admin/orders/id] error:', err.message)
    return NextResponse.json({ error: 'Erro ao buscar pedido' }, { status: 500 })
  }
}

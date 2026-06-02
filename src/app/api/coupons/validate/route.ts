import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { code, subtotal } = body

    if (!code) {
      return NextResponse.json({ error: 'Código do cupom obrigatório.' }, { status: 400 })
    }

    const supabase = getSupabase()

    const { data: coupon, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', code.toUpperCase().trim())
      .eq('is_active', true)
      .single()

    if (error || !coupon) {
      return NextResponse.json({ error: 'Cupom não encontrado ou inativo.' }, { status: 404 })
    }

    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Cupom expirado.' }, { status: 400 })
    }

    if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
      return NextResponse.json({ error: 'Cupom esgotado.' }, { status: 400 })
    }

    if (coupon.min_order_value && subtotal < coupon.min_order_value) {
      return NextResponse.json({
        error: `Pedido mínimo de R$ ${coupon.min_order_value.toFixed(2)} para este cupom.`
      }, { status: 400 })
    }

    // Check per-user limit
    const cookieStore = cookies()
    const accessToken = cookieStore.get('sb-access-token')?.value
    if (accessToken && coupon.max_uses_per_user) {
      const authClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { global: { headers: { Authorization: `Bearer ${accessToken}` } }, auth: { persistSession: false } }
      )
      const { data: { user } } = await authClient.auth.getUser(accessToken)

      if (user) {
        const { count } = await supabase
          .from('coupon_uses')
          .select('id', { count: 'exact', head: true })
          .eq('coupon_id', coupon.id)
          .eq('user_id', user.id)

        if (count && count >= coupon.max_uses_per_user) {
          return NextResponse.json({ error: 'Você já usou este cupom.' }, { status: 400 })
        }
      }
    }

    return NextResponse.json({
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
    })
  } catch (error) {
    console.error('Coupon validate error:', error)
    return NextResponse.json({ error: 'Erro ao validar cupom.' }, { status: 500 })
  }
}

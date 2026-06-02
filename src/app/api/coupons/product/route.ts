import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const productId = searchParams.get('productId')
    const category = searchParams.get('category')

    if (!productId) {
      return NextResponse.json({ error: 'productId obrigatório' }, { status: 400 })
    }

    const supabase = getSupabase()
    const now = new Date().toISOString()

    const { data, error } = await supabase
      .from('coupons')
      .select('id, code, description, discount_type, discount_value, applies_to, applies_to_ids')
      .eq('is_active', true)
      .eq('show_on_product', true)
      .or(`expires_at.is.null,expires_at.gt.${now}`)

    if (error) throw error

    const filtered = (data || []).filter((coupon) => {
      if (coupon.applies_to === 'all') return true
      if (coupon.applies_to === 'product' && coupon.applies_to_ids?.includes(productId)) return true
      if (coupon.applies_to === 'category' && category && coupon.applies_to_ids?.includes(category)) return true
      return false
    })

    return NextResponse.json({
      coupons: filtered.map(({ id, code, description, discount_type, discount_value }) => ({
        id, code, description, discount_type, discount_value
      }))
    })
  } catch (error) {
    console.error('Coupons fetch error:', error)
    return NextResponse.json({ error: 'Erro ao buscar cupons.' }, { status: 500 })
  }
}

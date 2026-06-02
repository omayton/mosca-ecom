import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// GET: public - fetch approved reviews for a product
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const productId = searchParams.get('productId')

    if (!productId) {
      return NextResponse.json({ error: 'productId obrigatório' }, { status: 400 })
    }

    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('product_reviews')
      .select('id, user_name, rating, title, comment, is_verified_purchase, created_at')
      .eq('product_id', parseInt(productId))
      .eq('is_approved', true)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Calculate stats
    const reviews = data || []
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0

    return NextResponse.json({
      reviews,
      stats: {
        count: reviews.length,
        avgRating: Math.round(avgRating * 10) / 10,
      }
    })
  } catch (error) {
    console.error('Reviews fetch error:', error)
    return NextResponse.json({ error: 'Erro ao buscar avaliações.' }, { status: 500 })
  }
}

// POST: authenticated - submit a review
export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers)
  const { success } = rateLimit(`review:${ip}`, { limit: 5, windowSeconds: 300 })
  if (!success) {
    return NextResponse.json({ error: 'Muitas tentativas. Aguarde.' }, { status: 429 })
  }

  try {
    const cookieStore = cookies()
    const accessToken = cookieStore.get('sb-access-token')?.value
    if (!accessToken) {
      return NextResponse.json({ error: 'Faça login para avaliar.' }, { status: 401 })
    }

    const supabase = getSupabase()

    // Verify user
    const authClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${accessToken}` } }, auth: { persistSession: false } }
    )
    const { data: { user } } = await authClient.auth.getUser(accessToken)
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 })
    }

    const body = await req.json()
    const { productId, rating, title, comment } = body

    if (!productId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })
    }

    // Check if user already reviewed this product
    const { data: existing } = await supabase
      .from('product_reviews')
      .select('id')
      .eq('product_id', productId)
      .eq('user_id', user.id)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Você já avaliou este produto.' }, { status: 409 })
    }

    // Check if user purchased this product (verified purchase)
    const { data: purchase } = await supabase
      .from('order_items')
      .select('id, orders!inner(user_id, status)')
      .eq('product_id', productId)
      .eq('orders.user_id', user.id)
      .eq('orders.status', 'confirmed')
      .limit(1)
      .single()

    const isVerified = !!purchase

    const userName = user.user_metadata?.name || user.email?.split('@')[0] || 'Cliente'

    const { data, error } = await supabase
      .from('product_reviews')
      .insert({
        product_id: productId,
        user_id: user.id,
        user_name: userName,
        rating,
        title: (title || '').slice(0, 100),
        comment: (comment || '').slice(0, 500),
        is_verified_purchase: isVerified,
        is_approved: false, // requires admin approval
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      review: data,
      message: 'Avaliação enviada! Será publicada após aprovação.'
    }, { status: 201 })
  } catch (error) {
    console.error('Review create error:', error)
    return NextResponse.json({ error: 'Erro ao enviar avaliação.' }, { status: 500 })
  }
}

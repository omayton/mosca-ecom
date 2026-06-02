import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// GET: list all reviews (pending and approved)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') // 'pending', 'approved', or null (all)

    const supabase = getSupabase()
    let query = supabase
      .from('product_reviews')
      .select(`
        *,
        products(name, slug)
      `)
      .order('created_at', { ascending: false })

    if (status === 'pending') query = query.eq('is_approved', false)
    if (status === 'approved') query = query.eq('is_approved', true)

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ reviews: data })
  } catch (error) {
    console.error('Admin reviews fetch error:', error)
    return NextResponse.json({ error: 'Erro ao buscar avaliações.' }, { status: 500 })
  }
}

// PATCH: approve or reject a review
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, isApproved } = body

    if (!id || isApproved === undefined) {
      return NextResponse.json({ error: 'ID e isApproved obrigatórios.' }, { status: 400 })
    }

    const supabase = getSupabase()

    const { error } = await supabase
      .from('product_reviews')
      .update({ is_approved: isApproved })
      .eq('id', id)

    if (error) throw error

    // Update product avg_rating cache
    const { data: review } = await supabase
      .from('product_reviews')
      .select('product_id')
      .eq('id', id)
      .single()

    if (review) {
      const { data: stats } = await supabase
        .from('product_reviews')
        .select('rating')
        .eq('product_id', review.product_id)
        .eq('is_approved', true)

      const reviews = stats || []
      const avgRating = reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0

      await supabase
        .from('products')
        .update({
          avg_rating: Math.round(avgRating * 10) / 10,
          review_count: reviews.length,
        })
        .eq('id', review.product_id)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin review update error:', error)
    return NextResponse.json({ error: 'Erro ao atualizar avaliação.' }, { status: 500 })
  }
}

// DELETE: remove a review
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID obrigatório.' }, { status: 400 })
    }

    const supabase = getSupabase()

    // Get product_id before deleting
    const { data: review } = await supabase
      .from('product_reviews')
      .select('product_id')
      .eq('id', parseInt(id))
      .single()

    const { error } = await supabase
      .from('product_reviews')
      .delete()
      .eq('id', parseInt(id))

    if (error) throw error

    // Update product cache
    if (review) {
      const { data: stats } = await supabase
        .from('product_reviews')
        .select('rating')
        .eq('product_id', review.product_id)
        .eq('is_approved', true)

      const reviews = stats || []
      const avgRating = reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0

      await supabase
        .from('products')
        .update({
          avg_rating: Math.round(avgRating * 10) / 10,
          review_count: reviews.length,
        })
        .eq('id', review.product_id)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin review delete error:', error)
    return NextResponse.json({ error: 'Erro ao excluir avaliação.' }, { status: 500 })
  }
}

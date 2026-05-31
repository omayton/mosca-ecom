import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const productId = searchParams.get('id')

    const supabase = getSupabaseClient()

    if (productId) {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, stock_quantity, stock_threshold, status, in_stock')
        .eq('id', productId)
        .single()

      if (error) throw error

      return NextResponse.json({
        productId: data.id,
        productName: data.name,
        stockQuantity: data.stock_quantity,
        stockThreshold: data.stock_threshold,
        status: data.status,
        inStock: data.in_stock
      })
    } else {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, stock_quantity, stock_threshold, status, in_stock')
        .order('name')

      if (error) throw error

      return NextResponse.json(data)
    }
  } catch (error) {
    console.error('Stock fetch error:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar estoque. Tente novamente.' },
      { status: 500 }
    )
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { productId, stockQuantity, stockThreshold, status } = await req.json()

    if (!productId) {
      return NextResponse.json(
        { error: 'ID do produto é obrigatório.' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseClient()

    const updates: any = {}
    if (stockQuantity !== undefined) {
      updates.stock_quantity = stockQuantity
      updates.in_stock = stockQuantity > 0
    }
    if (stockThreshold !== undefined) updates.stock_threshold = stockThreshold
    if (status !== undefined) updates.status = status

    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', productId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      productId: data.id,
      productName: data.name,
      stockQuantity: data.stock_quantity,
      stockThreshold: data.stock_threshold,
      status: data.status,
      inStock: data.in_stock
    })
  } catch (error) {
    console.error('Stock update error:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar estoque. Tente novamente.' },
      { status: 500 }
    )
  }
}
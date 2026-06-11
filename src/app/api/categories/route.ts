import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function GET() {
  try {
    const { data, error } = await getSupabase()
      .from('categories')
      .select('id, name, slug, sort_order')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error) throw error

    return NextResponse.json({ categories: data || [] })
  } catch (error) {
    console.error('Public categories fetch error:', error)
    return NextResponse.json({ categories: [] })
  }
}

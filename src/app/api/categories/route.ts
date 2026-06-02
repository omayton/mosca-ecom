import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const { data, error } = await supabase
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

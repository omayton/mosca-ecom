import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/require-admin'
import { slugify } from '@/lib/blog-db'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// GET — lista todos os posts (admin vê rascunhos) OU detalhe de um (?id=X)
export async function GET(req: NextRequest) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  const supabase = getSupabase()

  if (id) {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    if (error) return NextResponse.json({ error: 'Erro ao buscar post.' }, { status: 500 })
    if (!data) return NextResponse.json({ error: 'Post não encontrado.' }, { status: 404 })
    return NextResponse.json({ post: data })
  }

  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('id, slug, title, excerpt, cover_image_url, author, category, is_published, published_at, created_at, updated_at')
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json({ posts: data || [] })
  } catch (error) {
    console.error('Blog GET error:', error)
    return NextResponse.json({ error: 'Erro ao buscar posts.' }, { status: 500 })
  }
}

// POST — cria post
export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  try {
    const body = await req.json()
    const { title, excerpt, content, coverImageUrl, author, category, tags, isPublished, publishedAt, metaTitle, metaDescription } = body

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Título é obrigatório.' }, { status: 400 })
    }

    const supabase = getSupabase()

    // Gera slug único
    let slug = slugify(title)
    const { data: existing } = await supabase.from('blog_posts').select('slug').eq('slug', slug).maybeSingle()
    if (existing) {
      slug = `${slug}-${Date.now().toString(36).slice(-4)}`
    }

    // Estima tempo de leitura (~200 palavras/min)
    const wordCount = (content || '').trim().split(/\s+/).filter(Boolean).length
    const readingMinutes = Math.max(1, Math.round(wordCount / 200))

    const nowIso = new Date().toISOString()
    const willPublish = !!isPublished

    const { data, error } = await supabase
      .from('blog_posts')
      .insert({
        slug,
        title: title.trim(),
        excerpt: excerpt || null,
        content: content || '',
        cover_image_url: coverImageUrl || null,
        author: author || 'Equipe Mosca Branca Parts',
        category: category || null,
        tags: Array.isArray(tags) ? tags : [],
        reading_minutes: readingMinutes,
        meta_title: metaTitle || null,
        meta_description: metaDescription || null,
        is_published: willPublish,
        published_at: willPublish ? (publishedAt ? new Date(publishedAt).toISOString() : nowIso) : null,
      })
      .select()
      .single()

    if (error || !data) {
      console.error('Blog create error:', error)
      return NextResponse.json({ error: 'Erro ao criar post.' }, { status: 500 })
    }

    return NextResponse.json({ success: true, post: data })
  } catch (error) {
    console.error('Blog POST error:', error)
    return NextResponse.json({ error: 'Erro ao criar post.' }, { status: 500 })
  }
}

// PATCH — atualiza post (ou publica/despublica)
export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  try {
    const body = await req.json()
    const { id, title, excerpt, content, coverImageUrl, author, category, tags, isPublished, publishedAt, metaTitle, metaDescription } = body

    if (!id) return NextResponse.json({ error: 'ID obrigatório.' }, { status: 400 })

    const supabase = getSupabase()
    const updates: any = {}

    if (title !== undefined) {
      updates.title = title.trim()
      // Atualiza slug se mudou o título drasticamente? Mantemos slug estável p/ SEO.
    }
    if (excerpt !== undefined) updates.excerpt = excerpt || null
    if (content !== undefined) {
      updates.content = content || ''
      const wordCount = (content || '').trim().split(/\s+/).filter(Boolean).length
      updates.reading_minutes = Math.max(1, Math.round(wordCount / 200))
    }
    if (coverImageUrl !== undefined) updates.cover_image_url = coverImageUrl || null
    if (author !== undefined) updates.author = author || 'Equipe Mosca Branca Parts'
    if (category !== undefined) updates.category = category || null
    if (tags !== undefined) updates.tags = Array.isArray(tags) ? tags : []
    if (metaTitle !== undefined) updates.meta_title = metaTitle || null
    if (metaDescription !== undefined) updates.meta_description = metaDescription || null

    if (isPublished !== undefined) {
      updates.is_published = !!isPublished
      if (isPublished) {
        // Se publicando e sem data, define agora
        const { data: cur } = await supabase.from('blog_posts').select('published_at').eq('id', id).maybeSingle()
        if (!cur?.published_at) updates.published_at = new Date().toISOString()
      }
    }
    if (publishedAt !== undefined && publishedAt) {
      updates.published_at = new Date(publishedAt).toISOString()
    }

    const { error } = await supabase.from('blog_posts').update(updates).eq('id', id)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Blog PATCH error:', error)
    return NextResponse.json({ error: 'Erro ao atualizar post.' }, { status: 500 })
  }
}

// DELETE
export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID obrigatório.' }, { status: 400 })

    const supabase = getSupabase()
    const { error } = await supabase.from('blog_posts').delete().eq('id', id)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Blog DELETE error:', error)
    return NextResponse.json({ error: 'Erro ao excluir post.' }, { status: 500 })
  }
}

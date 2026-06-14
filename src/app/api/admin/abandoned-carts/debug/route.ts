import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdmin } from '@/lib/require-admin'

export const dynamic = 'force-dynamic'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Diagnóstico: mostra TODOS os cart_items crus, sem filtro de tempo
export async function GET() {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  try {
    const supabase = getSupabase()

    // 1. Todos os cart_items crus
    const { data: allCarts, error } = await supabase
      .from('cart_items')
      .select('user_id, product_id, quantity, first_added_at')
      .order('first_added_at', { ascending: false })

    if (error) {
      return NextResponse.json({ step: 'cart_items query', error: error.message }, { status: 500 })
    }

    // 2. Agrupar por user
    const byUser: Record<string, { count: number; oldest: string; newest: string }> = {}
    for (const row of allCarts || []) {
      const uid = row.user_id
      if (!byUser[uid]) byUser[uid] = { count: 0, oldest: row.first_added_at, newest: row.first_added_at }
      byUser[uid].count++
      if (new Date(row.first_added_at) < new Date(byUser[uid].oldest)) byUser[uid].oldest = row.first_added_at
      if (new Date(row.first_added_at) > new Date(byUser[uid].newest)) byUser[uid].newest = row.first_added_at
    }

    // 3. Buscar emails dos usuários
    const userIds = Object.keys(byUser)
    let emailMap: Record<string, string> = {}
    if (userIds.length > 0) {
      const { data: authUsers } = await supabase.auth.admin.listUsers()
      if (authUsers?.users) {
        for (const u of authUsers.users) {
          if (u.email) emailMap[u.id] = u.email
        }
      }
    }

    // 4. Verificar tabela de notificações
    const { data: notifs, error: notifErr } = await supabase
      .from('abandoned_cart_notifications')
      .select('user_id, channel, sent_at, recovered')

    // 5. Calcular tempo desde cada carrinho
    const now = Date.now()
    const summary = userIds.map(uid => {
      const info = byUser[uid]
      const ageHours = ((now - new Date(info.oldest).getTime()) / (1000 * 60 * 60)).toFixed(1)
      return {
        userId: uid,
        email: emailMap[uid] || 'sem email',
        itemCount: info.count,
        oldestItem: info.oldest,
        ageHours: Number(ageHours),
        wouldShowInAbandoned: Number(ageHours) >= 2,
      }
    })

    return NextResponse.json({
      totalCartItems: allCarts?.length || 0,
      uniqueUsers: userIds.length,
      notificationsTable: notifErr ? `ERRO: ${notifErr.message}` : `${notifs?.length || 0} notificações`,
      users: summary,
      cutoff2h: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
      now: new Date(now).toISOString(),
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 })
  }
}

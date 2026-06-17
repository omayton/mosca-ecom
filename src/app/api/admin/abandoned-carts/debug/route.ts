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

// Diagnóstico DEFINITIVO: testa o UPSERT real e mostra o erro exato.
// Roda server-side com o admin logado + service role (contorna o client).
export async function GET() {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  const supabase = getSupabase()
  const adminId = auth.user.id
  const report: Record<string, any> = { steps: [] }

  // 1. Colunas da tabela (via select * limit 1)
  const { data: sample, error: sampleErr } = await supabase
    .from('cart_items')
    .select('*')
    .limit(1)
    .maybeSingle()
  report.steps.push({
    step: '1. schema',
    columns: sample ? Object.keys(sample) : null,
    sampleError: sampleErr?.message || null,
    hasFirstAddedAt: sample ? 'first_added_at' in sample : false,
  })

  // 2. Contagem atual
  const { count } = await supabase
    .from('cart_items')
    .select('*', { count: 'exact', head: true })
  report.totalCartItems = count ?? 0

  // 3. TESTE DE UPSERT REAL (produto 1, qty 1) — simula exatamente o /api/cart POST
  const ts = new Date().toISOString()
  const { data: upsertData, error: upsertErr } = await supabase
    .from('cart_items')
    .upsert(
      [{ user_id: adminId, product_id: 1, quantity: 1, first_added_at: ts }],
      { onConflict: 'user_id,product_id' }
    )
    .select()
  report.steps.push({
    step: '3. upsert test (productId=1, admin user)',
    success: !upsertErr,
    error: upsertErr ? { message: upsertErr.message, code: upsertErr.code, details: upsertErr.details } : null,
    rowsAffected: upsertData?.length ?? 0,
  })

  // 4. Confirmar se gravou
  const { data: verify } = await supabase
    .from('cart_items')
    .select('user_id, product_id, quantity, first_added_at')
    .eq('user_id', adminId)
    .eq('product_id', 1)
  report.steps.push({
    step: '4. verify persistence',
    found: verify?.length ?? 0,
    row: verify?.[0] || null,
  })

  // 5. Limpar o item de teste
  if (verify && verify.length > 0) {
    await supabase.from('cart_items').delete().eq('user_id', adminId).eq('product_id', 1)
    report.steps.push({ step: '5. cleanup test item', deleted: true })
  }

  // 6. Todos os carts agrupados por user (para o painel)
  const { data: allCarts } = await supabase
    .from('cart_items')
    .select('user_id, product_id, quantity, first_added_at')
    .order('first_added_at', { ascending: false })

  const byUser: Record<string, any> = {}
  for (const row of allCarts || []) {
    if (!byUser[row.user_id]) byUser[row.user_id] = { count: 0, oldest: row.first_added_at }
    byUser[row.user_id].count++
    if (new Date(row.first_added_at) < new Date(byUser[row.user_id].oldest)) byUser[row.user_id].oldest = row.first_added_at
  }

  // emails
  const userIds = Object.keys(byUser)
  let emailMap: Record<string, string> = {}
  if (userIds.length > 0) {
    const { data: authUsers } = await supabase.auth.admin.listUsers()
    for (const u of authUsers?.users || []) if (u.email) emailMap[u.id] = u.email
  }

  const now = Date.now()
  report.users = userIds.map(uid => {
    const ageHours = ((now - new Date(byUser[uid].oldest).getTime()) / 36e5).toFixed(1)
    return { userId: uid, email: emailMap[uid] || '?', itemCount: byUser[uid].count, ageHours: Number(ageHours), wouldShowInAbandoned: Number(ageHours) >= 2 }
  })

  // DIAGNÓSTICO FINAL
  report.diagnostico = upsertErr
    ? `❌ UPSERT FALHOU: ${upsertErr.message} (code ${upsertErr.code}). Esse é o motivo dos carrinhos não persistirem.`
    : (verify && verify.length > 0)
      ? `✅ UPSERT FUNCIONA — o servidor grava no banco corretamente. Se o painel está vazio, o problema está no CLIENT (itens adicionados deslogados, ou sync não dispara).`
      : '⚠️ Upsert não errou mas item não apareceu — possível problema de RLS ou constraint.'

  return new NextResponse(JSON.stringify(report, null, 2), {
    headers: { 'content-type': 'application/json' },
  })
}

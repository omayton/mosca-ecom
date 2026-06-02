import { createClient } from "@supabase/supabase-js"

function getAdminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

interface AuditLogEntry {
  userId?: string
  userEmail?: string
  action: string
  entityType?: string
  entityId?: string
  details?: Record<string, any>
  ipAddress?: string
}

/**
 * Log an admin action to the audit trail.
 * Non-blocking — errors are swallowed to avoid breaking the main flow.
 */
export async function auditLog(entry: AuditLogEntry): Promise<void> {
  try {
    const supabase = getAdminSupabase()
    await supabase.from("admin_audit_log").insert({
      user_id: entry.userId || null,
      user_email: entry.userEmail || null,
      action: entry.action,
      entity_type: entry.entityType || null,
      entity_id: entry.entityId || null,
      details: entry.details || {},
      ip_address: entry.ipAddress || null,
    })
  } catch (err: any) {
    console.error("[audit] failed to log:", err.message)
  }
}

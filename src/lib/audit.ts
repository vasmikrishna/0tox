import { createClient } from "@/lib/supabase/server"

export interface AuditLogOpts {
  projectId: string
  userId: string
  userEmail: string
  action: string
  entityType?: string
  entityId?: string
  changes?: Record<string, { old: unknown; new: unknown }>
}

export async function logChange(opts: AuditLogOpts): Promise<void> {
  try {
    const userId = opts.userId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(opts.userId) ? opts.userId : null
    const supabase = createClient()
    await (supabase as any).from("audit_logs").insert({
      project_id: opts.projectId,
      user_id: userId,
      user_email: opts.userEmail,
      action: opts.action,
      entity_type: opts.entityType ?? null,
      entity_id: opts.entityId ?? null,
      changes: opts.changes ?? null,
    })
  } catch (err) {
    console.error("[audit] logChange failed:", err)
  }
}

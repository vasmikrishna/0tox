import { getSession } from "@/lib/session"
import { getTenantById, type Tenant } from "@/lib/tenant"

/**
 * Resolve the website-builder owner for the current request: the signed-in
 * user plus the tenant their session is bound to. Used by the /build flow and
 * its API routes. Returns null when there is no usable owner session.
 */
export async function getOwnerContext(): Promise<{
  session: { id: string; email: string; name: string; role: string; tenant_id: string }
  tenant: Tenant
} | null> {
  const session = await getSession()
  if (!session?.tenant_id || session.role === "admin") return null
  const tenant = await getTenantById(session.tenant_id)
  if (!tenant) return null
  return { session, tenant }
}

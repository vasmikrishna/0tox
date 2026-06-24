import { createClient } from "@/lib/supabase/server"

/**
 * A "workspace" is a tenant the current person has a user row in. Because the app
 * keys identity by (email, tenant_id), one email can have several user rows — one
 * per tenant they've signed up with. We discover them by matching the email.
 */
export interface Workspace {
  userId: string
  tenantId: string
  role: "admin" | "client" | "employee"
  name: string
  slug: string
  primary_color: string
  industry: string
  active: boolean
}

/**
 * All tenants the given email belongs to, newest-style first (owned tenants tend
 * to matter most, but ordering is left to the caller). `activeTenantId` flags the
 * one the current session is bound to.
 */
export async function getWorkspacesForEmail(email: string, activeTenantId?: string): Promise<Workspace[]> {
  const supabase = createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- hand-written DB types
  const { data } = await (supabase as any)
    .from("users")
    .select("id, role, tenant_id, tenants(id, name, slug, primary_color, industry)")
    .eq("email", email)

  if (!data) return []

  return (data as RawMembership[])
    .filter((m) => m.tenants && m.tenant_id) // skip orphaned rows whose tenant was deleted
    .map((m) => ({
      userId: m.id,
      tenantId: m.tenant_id,
      role: (m.role as Workspace["role"]) ?? "client",
      name: m.tenants?.name ?? m.tenant_id,
      slug: m.tenants?.slug ?? "",
      primary_color: m.tenants?.primary_color ?? "#6366f1",
      industry: m.tenants?.industry ?? "",
      active: m.tenant_id === activeTenantId,
    }))
}

interface RawMembership {
  id: string
  role: string | null
  tenant_id: string
  tenants: {
    id: string
    name: string | null
    slug: string | null
    primary_color: string | null
    industry: string | null
  } | null
}

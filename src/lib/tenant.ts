import { headers } from "next/headers"
import { cache } from "react"
import { createClient } from "@/lib/supabase/server"

export interface Tenant {
  id: string
  name: string
  slug: string
  industry: string
  plan: string
  status: string
  logo_url?: string
  primary_color: string
  contact_email?: string
  settings?: Record<string, unknown>
  created_at: string
}

/** Get the tenant slug set by middleware (falls back to env or "0tox") */
export async function getTenantSlug(): Promise<string> {
  const h = await headers()
  return h.get("x-tenant-slug") ?? process.env.TENANT_SLUG ?? "0tox"
}

/** Resolve tenant by slug — cached per request via React cache() */
export const getTenantBySlug = cache(async (slug: string): Promise<Tenant | null> => {
  const supabase = createClient()
  const { data } = await (supabase as any)
    .from("tenants")
    .select("*")
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle()
  return data ?? null
})

/** Convenience: resolve the current request's tenant */
export async function getCurrentTenant(): Promise<Tenant | null> {
  const slug = await getTenantSlug()
  return getTenantBySlug(slug)
}

/** Get the tenant_id for the current request — throws if no tenant found */
export async function requireTenantId(): Promise<string> {
  const tenant = await getCurrentTenant()
  if (!tenant) throw new Error("Tenant not found")
  return tenant.id
}

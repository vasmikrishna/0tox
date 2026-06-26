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
  onboarding_complete?: boolean
  custom_domain?: string | null
  domain_verified?: boolean
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

/** Resolve a tenant by id — cached per request via React cache(). */
export const getTenantById = cache(async (id: string): Promise<Tenant | null> => {
  const supabase = createClient()
  const { data } = await (supabase as any)
    .from("tenants")
    .select("*")
    .eq("id", id)
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

/** Minimal tenant fields needed to build a sitemap-index entry. */
export interface IndexableTenant {
  slug: string
  custom_domain: string | null
  domain_verified: boolean | null
  updated_at: string | null
}

/**
 * List tenants that should appear in the public sitemap index: active and
 * fully onboarded. Used by the apex `/sitemap-index.xml` route so new tenants
 * are discovered by search engines automatically, with no code change.
 */
export async function listIndexableTenants(): Promise<IndexableTenant[]> {
  const supabase = createClient()
  const { data } = await (supabase as any)
    .from("tenants")
    .select("slug, custom_domain, domain_verified, updated_at")
    .eq("status", "active")
    .eq("onboarding_complete", true)
    .order("slug", { ascending: true })
  return (data ?? []) as IndexableTenant[]
}

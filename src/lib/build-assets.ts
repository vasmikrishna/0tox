/**
 * Per-tenant "brand assets" library — the owner's drive of saved logos they
 * can reuse later. Stored on tenants.settings.brand_assets (the R2 files
 * themselves already live under builder/{tenantId}/...). Kept small and flat so
 * it serializes cleanly into the JSON settings column.
 */
import { createClient } from "@/lib/supabase/server"
import type { Tenant } from "@/lib/tenant"

export interface BrandAsset {
  id: string
  /** Absolute or app-relative URL to the stored file. */
  url: string
  kind: "logo"
  /** Logo style preset id, when generated (see lib/logo-styles). */
  style?: string
  /** ISO timestamp the asset was added. */
  createdAt: string
}

/** Cap so the settings JSON never grows unbounded. Oldest fall off. */
const MAX_ASSETS = 40

export function listBrandAssets(tenant: Tenant): BrandAsset[] {
  const raw = (tenant.settings as Record<string, unknown> | undefined)?.brand_assets
  if (!Array.isArray(raw)) return []
  return raw.filter((a): a is BrandAsset =>
    !!a && typeof a === "object" && typeof (a as BrandAsset).url === "string"
  )
}

async function writeBrandAssets(tenant: Tenant, assets: BrandAsset[]): Promise<void> {
  const supabase = createClient()
  const settings = { ...(tenant.settings ?? {}), brand_assets: assets }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- hand-written DB types
  const { error } = await (supabase as any)
    .from("tenants")
    .update({ settings })
    .eq("id", tenant.id)
  if (error) throw new Error(error.message ?? "Could not save brand assets")
}

export async function addBrandAsset(
  tenant: Tenant,
  input: { url: string; kind?: "logo"; style?: string; createdAt: string }
): Promise<{ asset: BrandAsset; assets: BrandAsset[] }> {
  const existing = listBrandAssets(tenant)
  // De-dupe by url so re-saving the same pick doesn't pile up.
  const deduped = existing.filter((a) => a.url !== input.url)
  const asset: BrandAsset = {
    id: crypto.randomUUID(),
    url: input.url,
    kind: input.kind ?? "logo",
    style: input.style,
    createdAt: input.createdAt,
  }
  const assets = [asset, ...deduped].slice(0, MAX_ASSETS)
  await writeBrandAssets(tenant, assets)
  return { asset, assets }
}

export async function removeBrandAsset(tenant: Tenant, id: string): Promise<BrandAsset[]> {
  const assets = listBrandAssets(tenant).filter((a) => a.id !== id)
  await writeBrandAssets(tenant, assets)
  return assets
}

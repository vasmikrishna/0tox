import { listIndexableTenants, type IndexableTenant } from "@/lib/tenant"
import { buildIndexEntries, buildSitemapIndexXml } from "@/lib/sitemap-index"

const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN ?? "site9.in"

// Tenant list changes infrequently; search engines don't need real-time
// freshness, so revalidate hourly instead of querying on every request.
export const revalidate = 3600

export async function GET(): Promise<Response> {
  const apexOrigin = `https://${BASE_DOMAIN}`

  let tenants: IndexableTenant[] = []
  try {
    tenants = await listIndexableTenants()
  } catch {
    // DB unavailable — still emit a valid index containing the main site.
  }

  const xml = buildSitemapIndexXml(buildIndexEntries(apexOrigin, tenants))
  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  })
}

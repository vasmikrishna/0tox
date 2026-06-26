import { getCanonicalOrigin, isMainSite } from "@/lib/seo"
import type { IndexableTenant } from "@/lib/tenant"

export interface SitemapIndexEntry {
  loc: string
  lastModified?: string | null
}

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

/** Serialize sitemap-index entries into the sitemaps.org XML format. */
export function buildSitemapIndexXml(entries: SitemapIndexEntry[]): string {
  const body = entries
    .map(({ loc, lastModified }) => {
      const lastmod = lastModified
        ? `\n    <lastmod>${xmlEscape(lastModified)}</lastmod>`
        : ""
      return `  <sitemap>\n    <loc>${xmlEscape(loc)}</loc>${lastmod}\n  </sitemap>`
    })
    .join("\n")
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</sitemapindex>\n`
}

/**
 * Build the ordered child-sitemap list for the apex index: the main marketing
 * site first, then one entry per indexable tenant (its verified custom domain,
 * else `{slug}.site9.in`). The main-site tenant row is skipped so its sitemap
 * isn't listed twice.
 */
export function buildIndexEntries(
  apexOrigin: string,
  tenants: IndexableTenant[],
): SitemapIndexEntry[] {
  const entries: SitemapIndexEntry[] = [{ loc: `${apexOrigin}/sitemap.xml` }]
  for (const tenant of tenants) {
    if (isMainSite(tenant.slug)) continue
    const origin = getCanonicalOrigin(tenant, tenant.slug)
    entries.push({ loc: `${origin}/sitemap.xml`, lastModified: tenant.updated_at })
  }
  return entries
}

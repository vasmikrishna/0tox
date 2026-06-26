import type { MetadataRoute } from "next"
import { headers } from "next/headers"
import { getTenantSlug } from "@/lib/tenant"
import { isMainSite } from "@/lib/seo"

const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN ?? "site9.in"

export default async function robots(): Promise<MetadataRoute.Robots> {
  const h = await headers()
  const host = h.get("host")?.split(":")[0] ?? BASE_DOMAIN
  const origin = `https://${host}`
  const slug = await getTenantSlug()

  // The apex advertises the sitemap index (which enumerates every tenant);
  // each tenant subdomain advertises its own per-tenant sitemap.
  const sitemap = isMainSite(slug) ? `${origin}/sitemap-index.xml` : `${origin}/sitemap.xml`

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/client/", "/employee/", "/superadmin/", "/api/", "/login", "/register"],
      },
    ],
    sitemap,
  }
}

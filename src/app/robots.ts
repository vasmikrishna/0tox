import type { MetadataRoute } from "next"
import { headers } from "next/headers"

const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN ?? "site9.in"

export default async function robots(): Promise<MetadataRoute.Robots> {
  const h = await headers()
  const host = h.get("host")?.split(":")[0] ?? BASE_DOMAIN
  const origin = `https://${host}`

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/client/", "/employee/", "/superadmin/", "/api/", "/login", "/register"],
      },
    ],
    sitemap: `${origin}/sitemap.xml`,
  }
}

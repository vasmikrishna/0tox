import type { Tenant } from "@/lib/tenant"
import type { SiteSettings } from "@/lib/site-settings"

const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN ?? "site9.in"

export function getCanonicalOrigin(tenant: Tenant | null, slug: string): string {
  if (tenant?.custom_domain && tenant.domain_verified) {
    return `https://${tenant.custom_domain}`
  }
  if (slug && slug !== "0tox") {
    return `https://${slug}.${BASE_DOMAIN}`
  }
  return `https://${BASE_DOMAIN}`
}

export function isMainSite(slug: string): boolean {
  return !slug || slug === "0tox"
}

export function buildLocalBusinessJsonLd(
  tenant: Tenant,
  settings: SiteSettings,
  canonicalOrigin: string,
) {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: settings.site_name ?? tenant.name,
    description: settings.site_tagline ?? "",
    url: canonicalOrigin,
    ...(tenant.logo_url ? { logo: tenant.logo_url } : {}),
    ...(settings.contact_email ? { email: settings.contact_email } : {}),
    ...(settings.contact_phone ? { telephone: settings.contact_phone } : {}),
    ...(settings.contact_address
      ? {
          address: {
            "@type": "PostalAddress",
            streetAddress: settings.contact_address,
          },
        }
      : {}),
  }
}

export function buildWebSiteJsonLd(canonicalOrigin: string, name: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name,
    url: canonicalOrigin,
  }
}

import type { Metadata } from "next"
import { getSiteSettings } from "@/lib/site-settings"
import { getTenantSlug, getCurrentTenant } from "@/lib/tenant"
import { getCanonicalOrigin, isMainSite, buildLocalBusinessJsonLd, buildWebSiteJsonLd } from "@/lib/seo"
import { SiteHeader } from "@/components/site/header"
import { SiteFooter } from "@/components/site/footer"

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings()
  const slug = await getTenantSlug()
  const tenant = await getCurrentTenant().catch(() => null)
  const origin = getCanonicalOrigin(tenant, slug)
  const siteName = settings.site_name ?? "Site9"
  const description = settings.site_tagline ?? "One Website for Every Business"

  return {
    title: {
      default: siteName,
      template: `%s | ${siteName}`,
    },
    description,
    metadataBase: new URL(origin),
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      siteName,
      title: siteName,
      description,
      url: origin,
      ...(tenant?.logo_url ? { images: [{ url: tenant.logo_url, alt: siteName }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: siteName,
      description,
      ...(tenant?.logo_url ? { images: [tenant.logo_url] } : {}),
    },
  }
}

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings()
  const slug = await getTenantSlug()
  const tenant = await getCurrentTenant().catch(() => null)
  const origin = getCanonicalOrigin(tenant, slug)
  const siteName = settings.site_name ?? "Site9"

  const jsonLdScripts = isMainSite(slug)
    ? [buildWebSiteJsonLd(origin, siteName)]
    : [
        buildWebSiteJsonLd(origin, siteName),
        ...(tenant ? [buildLocalBusinessJsonLd(tenant, settings, origin)] : []),
      ]

  const cssVars = `
    :root {
      --site-primary: ${settings.theme_primary};
      --site-secondary: ${settings.theme_secondary};
      --site-accent: ${settings.theme_accent};
      --site-bg: ${settings.theme_bg};
      --site-text: ${settings.theme_text};
    }
  `

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: cssVars }} />
      {jsonLdScripts.map((ld, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
        />
      ))}
      <div style={{ background: "var(--site-bg)", color: "var(--site-text)", minHeight: "100vh" }}>
        <SiteHeader settings={settings} />
        <main>{children}</main>
        <SiteFooter settings={settings} />
      </div>
    </>
  )
}

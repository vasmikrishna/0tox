# SEO — sitemaps & subdomain discovery

How the platform makes every tenant site discoverable to search engines. The
core constraint: **Google does not auto-discover subdomains** behind our
wildcard DNS (`*.site9.in`). A tenant subdomain is only crawled if it's linked
from a crawled page or listed in a sitemap. So the apex must enumerate tenants.

## Two layers

| Layer | Served at | Root element | Source |
|-------|-----------|--------------|--------|
| Per-tenant sitemap | `{slug}.site9.in/sitemap.xml` (and the apex's own pages) | `<urlset>` | `src/app/sitemap.ts` |
| Apex sitemap index | `site9.in/sitemap-index.xml` | `<sitemapindex>` | `src/app/sitemap-index.xml/route.ts` |

- **Per-tenant `sitemap.ts`** is host-aware: it lists that tenant's pages
  (home, /about, /services, /work, /contact + feature-gated /shop, /book, /blog,
  custom pages, products, posts). Unchanged by #12.
- **Apex `sitemap-index.xml`** is a Route Handler (Next's `sitemap.ts` helper can
  only emit `<urlset>`, never `<sitemapindex>`). It lists the apex's own
  `sitemap.xml` plus one child per indexable tenant. Cross-host child references
  are valid because `site9.in` is verified as a **Domain property** in Search
  Console (which also makes all subdomains' reporting roll up automatically).

## What counts as "indexable"

`listIndexableTenants()` (`src/lib/tenant.ts`): `status='active'` AND
`onboarding_complete=true`. Each tenant's child-sitemap URL comes from
`getCanonicalOrigin()` — the verified custom domain when present, else
`{slug}.site9.in`.

## Discovery is automatic

- `robots.ts` on the apex advertises `Sitemap: https://site9.in/sitemap-index.xml`,
  so crawlers find the index without a manual Search Console submission. Tenant
  subdomains advertise their own `sitemap.xml`.
- Add a tenant → it appears in the index within the hourly revalidation window.
  No code change, no redeploy.

## Files
| Concern | File |
|---------|------|
| Apex index route | `src/app/sitemap-index.xml/route.ts` |
| Pure builders (tested) | `src/lib/sitemap-index.ts` (`buildIndexEntries`, `buildSitemapIndexXml`) |
| Tenant enumeration | `src/lib/tenant.ts` → `listIndexableTenants()`, `IndexableTenant` |
| Per-tenant sitemap | `src/app/sitemap.ts` |
| robots | `src/app/robots.ts` |
| Origin resolution | `src/lib/seo.ts` → `getCanonicalOrigin()`, `isMainSite()` |
| Tests | `src/lib/sitemap-index.test.ts` |

## Submitting to Google
Submit **one** sitemap in Search Console for the `site9.in` Domain property:
`https://site9.in/sitemap-index.xml`. Google reads the index and fetches each
child sitemap. The apex `sitemap.xml` is also referenced from within the index.

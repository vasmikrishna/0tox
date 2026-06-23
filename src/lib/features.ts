/**
 * Feature flags — hide features from view without deleting any code or data.
 *
 * Flip a flag to `true` to re-enable. When a feature is off:
 *  - its admin sidebar links are hidden (portal-sidebar.tsx)
 *  - its routes are blocked and redirected (middleware.ts)
 *  - any related public behavior is skipped (e.g. homepage override for pages)
 *
 * The underlying pages, API routes, DB tables, and seeded data all remain in
 * place — nothing is removed.
 */
export const FEATURES = {
  /** Storefront, products, and orders (/shop, /admin/products, /admin/orders). */
  ecommerce: false,
  /** Custom HTML page builder (/admin/pages, /p/[slug], homepage override). */
  pageBuilder: true,
  /** Appointment bookings + calendar blocking (/admin/bookings). */
  bookings: true,
  /** Per-tenant blog (/admin/blog, /blog, /blog/[slug]). Available to all tenants. */
  blog: true,
} as const

export type FeatureKey = keyof typeof FEATURES

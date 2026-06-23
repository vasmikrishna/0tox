# Changelog

## [Unreleased]

### Added — Blog (per-tenant, all admins)
- `blog_posts` table (tenant-scoped): title, slug, excerpt, TipTap `content_html` + `content_json`, cover image, author, tags, draft/published, and full SEO fields (`meta_title`, `meta_description`, `og_image_url`, `canonical_url`, `noindex`, `published_at`). RLS disabled + grants per project convention (`016_blog.sql`). Behind `FEATURES.blog` (on for all tenants).
- Admin **Blog** (`/admin/blog`): list, create, edit, delete. TipTap rich-text editor (`blog-editor.tsx`) with headings/lists/links/formatting, cover-image upload (reuses `/api/build/upload`), tags, and a collapsible SEO panel.
- **Super-admin oversight** (`/superadmin/blog`): cross-tenant list with publish/unpublish + delete moderation.
- Public **blog** (`/blog`, `/blog/[slug]`): tenant-scoped index + post pages with `generateMetadata` (canonical/OpenGraph, `noindex` support) and **BlogPosting JSON-LD** (`buildArticleJsonLd` in `lib/seo.ts`). Posts added to `sitemap.ts`; "Blog" link in the public header.
- API: `GET/POST /api/admin/blog`, `GET/PATCH/DELETE /api/admin/blog/[id]`, `GET /api/superadmin/blog`, `PATCH/DELETE /api/superadmin/blog/[id]`.

### Added — Razorpay billing management (manage / cancel / change plan / invoices / receipts)
- Tenant **Billing** page (`/admin/billing`): current plan, status, renewal/expiry date, **change plan**, **cancel** (at period end), and **invoice/receipt history**.
- New `subscription_invoices` table + `cancel_at_period_end` / `cancelled_at` columns on `subscriptions` (`015_subscription_invoices.sql`).
- API: `POST /api/billing/cancel`, `POST /api/billing/change-plan`, `GET /api/billing/invoices`. `GET /api/billing/status` now returns `cancelAtPeriodEnd`.
- **Hardened webhook**: records each `subscription.charged` / `invoice.paid` as an invoice (idempotent on `razorpay_invoice_id`) and sends a **receipt email**; sends a **payment-failed email** on `halted`/failed. New `lib/email/billing.ts`; reusable `useRazorpayCheckout` hook.

### Added — Subscriptions / Razorpay billing (#4)
- `subscriptions` table (one row per tenant): plan, Razorpay subscription/plan/customer ids, status, `current_end`. RLS disabled + grants per project convention (`013_subscriptions.sql`).
- **Soft upsell** — publishing is never blocked. Unsubscribed tenants see an `UpgradeBanner` in the builder ("Unlock your site's full potential"); it disappears once a subscription is active.
- Plans: **Monthly ₹29** and **Annual ₹108** (₹9/month). Created via `pnpm exec tsx src/scripts/razorpay-setup.ts`.
- API: `POST /api/billing/subscribe` (creates Razorpay subscription + returns Checkout params), `POST /api/billing/verify` (verifies the Checkout signature, activates), `POST /api/billing/webhook` (subscription lifecycle → status), `GET /api/billing/status`.
- Browser uses the Razorpay Checkout widget (loaded on demand). **No Razorpay keys?** `subscribe` unlocks inline (dev fallback) so the flow stays demoable.
- `lib/razorpay.ts` (client, plan catalogue, signature verification) and `lib/subscription.ts` (entitlement check, upserts). Unit tests in `src/lib/subscription.test.ts` (`pnpm test`).

### Added — Bookings module
- `bookings` and `calendar_blocks` tables (tenant-scoped), RLS disabled + grants per project convention.
- Admin **Bookings** (`/admin/bookings`) with two tabs:
  - **Booking management** — list appointments filtered by status, create new bookings, confirm → complete → cancel transitions, delete.
  - **Block the calendar** — add/remove blocked time ranges (one-off or all-day) that mark you unavailable.
- Public **self-booking** page (`/book`): customers pick a service, date/time and duration and request an appointment (created as `pending`). `GET/POST /api/book` resolves the tenant by subdomain; POST **rejects (409)** any request that overlaps a calendar block or an existing live booking, and the form shows a soft conflict warning client-side.
- API: `GET/POST /api/admin/bookings`, `PATCH/DELETE /api/admin/bookings/[id]`, `GET/POST /api/admin/calendar-blocks`, `DELETE /api/admin/calendar-blocks/[id]` (admin-only).
- All-day calendar blocks are expanded to full-day timestamp ranges so overlap checks work.
- Gated by `FEATURES.bookings` (`src/lib/features.ts`, default on): sidebar link hidden + `/admin/bookings` and `/book` redirect when off.

### Added — E-commerce module (#2)
- `products`, `orders`, `order_items` tables (tenant-scoped) with stock tracking and a `decrement_product_stock` function.
- Admin **Products** (`/admin/products`): list, create, inline stock +/- , status, image URL, edit, delete.
- Admin **Orders** (`/admin/orders`): list + detail with status changes.
- Public **Storefront** (`/shop`, `/shop/[slug]`): product grid + detail, client-side cart (localStorage), cart page.
- Checkout (`POST /api/store/checkout`) reuses the Stripe pattern; the webhook marks orders paid and decrements stock. Falls back to inline completion when Stripe is not configured (dev).

### Added — Page Builder (#1)
- `custom_pages` table (tenant-scoped): raw HTML/CSS, draft/published, `is_homepage`.
- Admin **Pages** (`/admin/pages`): create from starter templates (landing / portfolio / coming-soon / blank), HTML+CSS editor with live preview, publish/unpublish, set-as-homepage, delete.
- Public render at `/p/[slug]`; a published `is_homepage` page overrides the public homepage.
- HTML/CSS sanitized at render time (`src/lib/sanitize-html.ts`).

### Changed
- E-commerce and Page Builder are **hidden by default** via `src/lib/features.ts` (`ecommerce`/`pageBuilder` flags). Sidebar links are hidden and routes (`/shop`, `/p/*`, `/admin/products`, `/admin/orders`, `/admin/pages`) redirect away. Flip a flag to `true` to re-enable — no code or data is removed.

### Notes
- DB migrations: `005_ecommerce.sql`, `006_custom_pages.sql` (applied; grants added, RLS left disabled to match existing tables).
- Generated Supabase types extended in `src/lib/supabase/types.ts`.
- Sidebar gains **Products**, **Orders**, **Pages** under the admin portal.

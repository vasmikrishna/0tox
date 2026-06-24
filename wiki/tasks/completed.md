# Completed tasks

- **2026-06-24 — Global login on the main domain** — #5
  `/api/auth/login` is host-aware: subdomain → tenant-bound; main domain → global
  login across all tenants, then hand off to the owner's `{slug}.site9.in`
  (cookie scoped to `.site9.in`). Multi-tenant emails use the workspace picker
  (`/api/auth/select-workspace`). Superadmin account unchanged.

- **2026-06-24 — Blog (per-tenant, all admins)**
  TipTap blog with SEO: `blog_posts` (`016_blog.sql`), admin CRUD at `/admin/blog`,
  super-admin oversight at `/superadmin/blog`, public `/blog` + `/blog/[slug]` with
  BlogPosting JSON-LD + sitemap. Behind `FEATURES.blog` (on for all tenants).
  See [features/blog.md](../features/blog.md).
- **2026-06-24 — Razorpay billing management** — manage/cancel/change-plan/invoices
  `/admin/billing` page, `subscription_invoices` (`015_subscription_invoices.sql`),
  cancel + change-plan APIs, hardened webhook recording charges + receipt/failed
  emails (`lib/email/billing.ts`), `useRazorpayCheckout` hook.
  See [features/billing.md](../features/billing.md).

- **2026-06-23 — Razorpay subscriptions (soft upsell)** — #4
  Recurring subscriptions (Monthly ₹29 / Annual ₹108) with an upgrade banner in
  the builder that hides once active. Publishing stays open (soft gate).
  Tables/migration `013_subscriptions.sql`, `lib/razorpay.ts`, `lib/subscription.ts`,
  `/api/billing/*`, `UpgradeBanner`, setup script, unit + e2e tests.
  See [features/billing.md](../features/billing.md).

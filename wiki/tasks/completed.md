# Completed tasks

- **2026-06-24 — Login page: show/hide password + phone number field** — #9
  Added eye-icon show/hide password toggle (`data-testid="login-password-toggle"`)
  inside the password field on `/login`. Also added an optional phone number field
  (`data-testid="login-phone"`). Phone is collect & store only: login stays
  email+password, but the route persists the number onto the matched user
  record(s) (migration `017_user_phone.sql` adds the `phone` column). Consistent
  toggle also added to the `/start` registration form
  (`data-testid="start-password-toggle"`). No new type errors (`tsc --noEmit`
  clean). See [features/auth-login.md](../features/auth-login.md).
- **2026-06-24 — Blog improvements** — #8
  Three improvements to the blog feature: (1) Public `/blog` and `/blog/[slug]`
  pages now render using the tenant's own theme (CSS vars `--site-primary`,
  `--site-accent`, `--site-bg`, `--site-text`) with a full-width primary-color
  hero banner and cover-image hero on post pages — matching the rest of the public
  site. (2) Search + pagination added to `/blog` via a new `BlogIndexClient`
  client wrapper around the existing `PaginatedList` component (9 posts per page,
  searches title + excerpt). (3) Blog panel surfaced in the website builder: a
  new `BlogPanel` component (`src/components/build/blog-panel.tsx`) toggleable via
  the FileText icon in the builder top bar shows the tenant's posts (published vs.
  drafts), links to create/edit posts in the admin, and links to the live public
  blog — all without leaving the builder.
  See [features/blog.md](../features/blog.md).

- **2026-06-24 — Customer accounts + unified "My Businesses" hub** — #7
  Public sites get Sign in/Sign up + a "My account" dropdown. New `/account` hub
  (`(account)` group, outside tenant-isolation) lists every business you belong to
  — owned / customer-of / work-with — with "Enter" via `switch-workspace`. Client
  portal gains Orders, Bookings, Profile (scoped by identity + tenant). Added
  `bookings.customer_id` (`015`, backfilled) set on create when signed in. Shared
  `getWorkspacesForEmail()`; built on the existing email-keyed model (no
  memberships refactor). See [features/customer-accounts.md](../features/customer-accounts.md).

- **2026-06-24 — Search + pagination for list/table views** — #6
  Reusable `src/components/paginated-list.tsx` (search box + Previous/Next pager,
  auto-hiding) applied to 16 admin/superadmin lists. Server pages keep their query
  and delegate to sibling `*-list.tsx` client components paginating fetched rows.
  Templates/Sections get search only (status grouping preserved). No query/style
  changes.

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

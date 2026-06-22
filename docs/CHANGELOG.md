# Changelog

## [Unreleased]

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

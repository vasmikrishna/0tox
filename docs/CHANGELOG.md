# Changelog

## [Unreleased]

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

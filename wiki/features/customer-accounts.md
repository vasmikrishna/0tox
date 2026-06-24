# Customer accounts + unified "My Businesses" hub

One person, one login, many businesses. A visitor can sign up / log in on any tenant's public site to become that business's **customer**; the same account can be a customer of several tenants and the **owner** of others, all reachable from one hub. Built on the existing identity model — see [DECISIONS ADR-002](../../docs/DECISIONS.md).

## Identity model (unchanged)
Identity is keyed by `(email, tenant_id)` — the same email has **one user row per tenant**, each with its own `role` (`admin` = owner, `client` = customer, `employee` = team). "Workspaces" = the tenants an email belongs to, discovered by matching the email. The session cookie is scoped to `.site9.in`, so it carries across all subdomains. No memberships table.

- `src/lib/workspaces.ts` — `getWorkspacesForEmail(email, activeTenantId)`, the single source of "which businesses do I belong to." `GET /api/auth/workspaces` is a thin wrapper over it.

## Surfaces
| Area | Path | Notes |
|------|------|-------|
| Public header (logged out) | every public page | `Sign in` (→ `/login`) + `Sign up` (→ `/register`) |
| Public header (logged in) | every public page | "My account" dropdown → My businesses, My dashboard, Sign out |
| Unified hub | `/account` | groups: owned / customer-of / work-with; "Enter" per business; create-new CTA |
| Customer orders | `/client/orders`, `/client/orders/[id]` | scoped by `customer_id` + `tenant_id` |
| Customer bookings | `/client/bookings` | scoped by `customer_email` + `tenant_id` |
| Customer profile | `/client/profile` | read-only account details + link to hub |

Header auth is passed from `(public)/layout.tsx` (server, `getSession()`) into `components/site/header.tsx`.

## The hub (`/account`)
New `(account)` route group, **outside** `(client)/(admin)/(employee)`, so it is **not** in `middleware.ts`'s `isProtected` set — the subdomain tenant-isolation that clears mismatched sessions never fires here. The page (`getSession()`) redirects to `/login` if signed out (super-admin → `/login`, they use `/superadmin`).

**Entering a business** (`account-hub.tsx`): `POST /api/auth/switch-workspace { tenantId }` re-points the session at that tenant, then a full navigation to `{slug}.{BASE_DOMAIN}{dashboard}` (cookie shared) so isolation passes on arrival. Dev caveat: cross-subdomain only works in production where the cookie is domain-scoped; on localhost the host-only cookie doesn't carry to `slug.localhost`.

## Customer data scoping (security)
All customer reads run **server-side via the service-role client**, filtered by **both** the user identity and the **current** `tenant_id` — a customer of business A can never see business B's data. Orders match `customer_id = session.id`; bookings match `customer_email = session.email`; both `AND tenant_id = session.tenant_id`.

## Booking ↔ customer linkage
`bookings.customer_id` (nullable, FK `users`) added in `015_bookings_customer_id.sql` and backfilled by matching email within the same tenant. `POST /api/book` sets it when the requester is signed into that tenant (guests stay null). The customer bookings view still matches by email (covers guests + logged-in alike); `customer_id` is for reliable association going forward.

## Feature flags
Client **Orders** nav is gated by `FEATURES.ecommerce` (currently off), **Bookings** by `FEATURES.bookings` (on) — same `hiddenHrefs` mechanism as the admin nav in `portal-sidebar.tsx`. Pages exist regardless; only the nav entry is hidden.

## Notes / future
- Profile is read-only for now (no edit endpoint yet).
- The agency client dashboard (`/client/dashboard`) still looks up the user by email with `.single()`, which is fragile for multi-workspace users; new views use `session.id` directly. Worth migrating the dashboard too.
- If we later need invitations or central user management, revisit the memberships-table model (ADR-002).

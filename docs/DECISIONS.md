# Architecture Decision Records

## ADR-002 — Customer accounts as cross-tenant identity by email, not a memberships table (2026-06-24, #7)

**Context.** We want one person to sign up as a **customer** on any tenant's
public site, span multiple tenants, optionally own their own, and see everything
from one place. The app already keys identity by `(email, tenant_id)` — the same
email gets one user row per tenant, and "workspaces" are discovered by matching
the email (with a sidebar switcher + login picker already built).

**Decision.**
- **Build on the existing model** — no canonical-user / memberships-table
  refactor. Role lives per user row, so a person is already `admin` of one tenant
  and `client` of another. A shared `getWorkspacesForEmail()` is the single source
  for "which businesses do I belong to."
- **The hub (`/account`) lives outside the tenant-isolated route groups.** It is
  not in `middleware.ts`'s `isProtected` set, so the session is never cleared
  there; the page enforces auth itself. "Enter" uses `switch-workspace` then a
  full navigation to the target subdomain (cookie is `.site9.in`-scoped).
- **Customer data is read server-side (service role), filtered by user identity
  AND current `tenant_id`** — never cross-tenant. Orders use `customer_id`,
  bookings use email (+ new `customer_id` for new ones).

**Why not a memberships table?** It's the cleaner long-term model (central
identity, invites, one row per person) but a large, risky refactor of custom JWT
auth (login/register/google/middleware/switch) for no user-visible gain here. The
email-keyed model already delivers the multi-tenant account; revisit if we need
invitations or central user management. Trade-off: emails aren't globally unique,
and workspace discovery is an email scan rather than a join.

## ADR-001 — Razorpay subscriptions as a soft upsell (2026-06-23, #4)

**Context.** We want recurring revenue and to nudge tenants toward paying, but
blocking publishing for unpaid tenants kills activation for a self-serve builder.

**Decision.**
- Use **Razorpay Subscriptions** (recurring) — Monthly ₹29 and Annual ₹108 (₹9/mo).
- **Soft gate:** publishing is always allowed. An unpaid tenant sees an
  `UpgradeBanner` in the builder; an active subscription hides it. Entitlement is
  derived from a per-tenant `subscriptions` row, not from `tenants.plan`.
- **Webhook is the source of truth** for subscription status; the post-Checkout
  `verify` call only gives the user an instant unlock.
- **Dev fallback:** with no `RAZORPAY_*` env, `subscribe` activates inline so the
  flow is demoable locally — mirrors the existing Stripe checkout convention.

**Why not Stripe (already in the repo)?** Stripe powers project/store payments,
but the audience is India-first; Razorpay is the better fit for INR subscriptions
and UPI mandates. The two coexist.

**Consequences.**
- New `subscriptions` table (RLS disabled + grants, per project convention).
- Razorpay Checkout JS is loaded on demand in the browser.
- Future work can flip to a hard gate by checking `isSubscriptionActive` in
  `/api/build/publish`; the entitlement helper already exists.

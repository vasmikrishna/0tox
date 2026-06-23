# Architecture Decision Records

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

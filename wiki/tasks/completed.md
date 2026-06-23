# Completed tasks

- **2026-06-23 — Razorpay subscriptions (soft upsell)** — #4
  Recurring subscriptions (Monthly ₹29 / Annual ₹108) with an upgrade banner in
  the builder that hides once active. Publishing stays open (soft gate).
  Tables/migration `013_subscriptions.sql`, `lib/razorpay.ts`, `lib/subscription.ts`,
  `/api/billing/*`, `UpgradeBanner`, setup script, unit + e2e tests.
  See [features/billing.md](../features/billing.md).

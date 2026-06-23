# Billing — Razorpay subscriptions

Recurring subscriptions that gate a **soft upsell** in the website builder.
Publishing is **never blocked**; an active subscription only hides the upgrade
prompt and unlocks "full potential" perks (branding removal, custom domain, etc.).

## Plans
| Plan | Price | Notes |
|------|-------|-------|
| Monthly | ₹29 / month | Billed monthly, cancel anytime |
| Annual | ₹108 / year | ₹9/month — best value |

Plans are created once in the Razorpay dashboard via the setup script and their
ids stored in env.

## Data model
- **subscriptions** (one row per tenant) — `tenant_id (unique)`, `plan (monthly|annual)`, `status`, `razorpay_subscription_id`, `razorpay_plan_id`, `razorpay_customer_id`, `short_url`, `current_end`, timestamps.
- **Entitlement** (`isSubscriptionActive`): status in `active`/`authenticated` **and** `current_end` (if set) is in the future.

## Surfaces
| Area | Path |
|------|------|
| Upsell banner | `src/components/build/upgrade-banner.tsx` (rendered in the builder) |
| Start subscription | `POST /api/billing/subscribe` |
| Verify after Checkout | `POST /api/billing/verify` |
| Lifecycle webhook | `POST /api/billing/webhook` |
| Status | `GET /api/billing/status` |
| Razorpay client/plans/signatures | `src/lib/razorpay.ts` |
| Entitlement + upserts | `src/lib/subscription.ts` |
| Plan setup (run once) | `src/scripts/razorpay-setup.ts` |

## Flow
1. Unsubscribed tenant opens `/build` → sees the **UpgradeBanner**.
2. Clicks **Subscribe** → picks Monthly or Annual.
3. `POST /api/billing/subscribe` creates a Razorpay subscription, stores a
   `created` row, and returns `{ subscriptionId, keyId, ... }`.
4. Browser opens **Razorpay Checkout**; on success its `handler` calls
   `POST /api/billing/verify`, which checks the signature and flips the row to
   `active`. The banner disappears.
5. `POST /api/billing/webhook` keeps status in sync over time
   (`activated`/`charged`/`halted`/`cancelled`/`completed`). **Source of truth.**
6. **No Razorpay keys (dev)?** `subscribe` activates inline and skips Checkout.

## Setup
1. Add `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` to `.env.local`.
2. `set -a && source .env.local && set +a && pnpm exec tsx src/scripts/razorpay-setup.ts`
3. Paste the printed `RAZORPAY_PLAN_MONTHLY_ID` / `RAZORPAY_PLAN_ANNUAL_ID` into `.env.local`.
4. In the Razorpay dashboard, add a webhook → `/api/billing/webhook` with the
   `subscription.*` events and the same `RAZORPAY_WEBHOOK_SECRET`.

## Notes / future
- Apply migration `013_subscriptions.sql` (grants added, RLS left disabled to match existing tables).
- Coexists with the existing **Stripe** flows (project/store payments) — Razorpay is for INR subscriptions.
- To make it a **hard gate** later, check `isSubscriptionActive` in `POST /api/build/publish`.
- Not yet built: billing history / invoices page, plan switching/proration, cancel-from-portal UI, and the perks the subscription unlocks (badge removal wiring).

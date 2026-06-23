-- Subscription invoices + cancellation tracking for the Razorpay billing flow.
-- Each successful charge (subscription.charged / invoice.paid webhook) is recorded
-- here so the tenant can see a billing history and download receipts.
--
-- No RLS on this app (service-role server client + app-level auth) — grants only.

-- ── Cancellation columns on the existing subscriptions table ──────────────────
alter table public.subscriptions
  add column if not exists cancel_at_period_end boolean not null default false;
alter table public.subscriptions
  add column if not exists cancelled_at timestamptz;

-- ── Invoice / receipt history ────────────────────────────────────────────────
create table if not exists public.subscription_invoices (
  id                  uuid primary key default gen_random_uuid(),
  tenant_id           uuid not null references public.tenants(id) on delete cascade,
  subscription_id     uuid references public.subscriptions(id) on delete set null,
  razorpay_invoice_id text,
  razorpay_payment_id text,
  amount              integer not null default 0,   -- in paise (₹1 = 100)
  currency            text not null default 'INR',
  status              text not null default 'paid',  -- paid | issued | failed
  period_start        timestamptz,
  period_end          timestamptz,
  invoice_url         text,
  paid_at             timestamptz,
  created_at          timestamptz not null default now()
);

-- Idempotency: one row per Razorpay invoice (webhook may fire more than once).
create unique index if not exists subscription_invoices_rzp_invoice_idx
  on public.subscription_invoices (razorpay_invoice_id)
  where razorpay_invoice_id is not null;

create index if not exists subscription_invoices_tenant_idx
  on public.subscription_invoices (tenant_id);

grant all privileges on table public.subscription_invoices to anon, authenticated, service_role;

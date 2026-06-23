-- Razorpay subscriptions: gates the "full potential" upsell on the builder.
-- One active subscription per tenant. The site can always be published (soft
-- upsell); the subscription only controls whether the upgrade prompt shows.
--
-- No RLS on this app (service-role server client + app-level auth) — grants only.

create table if not exists public.subscriptions (
  id                       uuid primary key default gen_random_uuid(),
  tenant_id                uuid not null references public.tenants(id) on delete cascade,
  plan                     text not null default 'monthly' check (plan in ('monthly', 'annual')),
  -- Razorpay subscription lifecycle: created → authenticated → active →
  -- (halted | cancelled | completed | expired). 'active'/'authenticated' unlock.
  status                   text not null default 'created',
  razorpay_subscription_id text,
  razorpay_plan_id         text,
  razorpay_customer_id     text,
  short_url                text,
  current_end              timestamptz,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

-- One subscription row per tenant (we upsert on tenant_id).
create unique index if not exists subscriptions_tenant_idx
  on public.subscriptions (tenant_id);

-- Fast lookup by Razorpay id for webhook updates.
create unique index if not exists subscriptions_rzp_id_idx
  on public.subscriptions (razorpay_subscription_id)
  where razorpay_subscription_id is not null;

create index if not exists subscriptions_status_idx
  on public.subscriptions (status);

-- updated_at trigger (touch_updated_at() defined in migration 002)
drop trigger if exists subscriptions_touch on public.subscriptions;
create trigger subscriptions_touch
  before update on public.subscriptions
  for each row execute function public.touch_updated_at();

grant all privileges on table public.subscriptions to anon, authenticated, service_role;

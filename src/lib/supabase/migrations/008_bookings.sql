-- Bookings & calendar blocking for tenant businesses.
--   bookings        — appointments a customer/admin creates against a tenant.
--   calendar_blocks — time ranges marked unavailable (holidays, breaks, days off).
-- Per project convention: RLS DISABLED + explicit grants (custom JWT auth,
-- service-role server client everywhere). New tables fail reads without grants.

create table if not exists public.bookings (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid references public.tenants(id) on delete cascade,
  customer_name   text not null,
  customer_email  text,
  customer_phone  text,
  service         text,
  starts_at       timestamptz not null,
  ends_at         timestamptz not null,
  status          text not null default 'pending'
                    check (status in ('pending', 'confirmed', 'completed', 'cancelled')),
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists bookings_tenant_idx    on public.bookings (tenant_id);
create index if not exists bookings_status_idx    on public.bookings (status);
create index if not exists bookings_starts_at_idx on public.bookings (starts_at);

create table if not exists public.calendar_blocks (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid references public.tenants(id) on delete cascade,
  title       text not null default 'Unavailable',
  starts_at   timestamptz not null,
  ends_at     timestamptz not null,
  all_day     boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists calendar_blocks_tenant_idx on public.calendar_blocks (tenant_id);
create index if not exists calendar_blocks_range_idx  on public.calendar_blocks (starts_at, ends_at);

-- updated_at trigger (touch_updated_at() defined in migration 002)
drop trigger if exists bookings_touch on public.bookings;
create trigger bookings_touch
  before update on public.bookings
  for each row execute function public.touch_updated_at();

-- RLS disabled by project convention; grant to all app roles or reads fail.
alter table public.bookings        disable row level security;
alter table public.calendar_blocks disable row level security;

grant all on public.bookings        to anon, authenticated, service_role;
grant all on public.calendar_blocks to anon, authenticated, service_role;

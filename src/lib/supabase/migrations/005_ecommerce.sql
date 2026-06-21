-- E-commerce: simple WooCommerce-style store, scoped per tenant.
-- Products with stock tracking, orders, and order line items.
-- Admin-only management via service-role API; storefront reads active products.

-- ── Products ─────────────────────────────────────────────────────────────────
create table if not exists public.products (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid references public.tenants(id) on delete cascade,
  name           text not null,
  slug           text not null,
  description    text,
  price          numeric(12,2) not null default 0,
  sale_price     numeric(12,2),
  sku            text,
  stock_quantity integer not null default 0,
  manage_stock   boolean not null default true,
  status         text not null default 'draft' check (status in ('draft', 'active', 'archived')),
  image_url      text,
  images         jsonb not null default '[]',
  category       text,
  sort_order     integer not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (tenant_id, slug)
);

create index if not exists products_tenant_idx on public.products (tenant_id);
create index if not exists products_status_idx on public.products (status);
create index if not exists products_sort_idx on public.products (sort_order);

-- ── Orders ───────────────────────────────────────────────────────────────────
create table if not exists public.orders (
  id                       uuid primary key default gen_random_uuid(),
  tenant_id                uuid references public.tenants(id) on delete cascade,
  customer_id              uuid references public.users(id) on delete set null,
  customer_name            text,
  customer_email           text not null,
  total                    numeric(12,2) not null default 0,
  currency                 text not null default 'usd',
  status                   text not null default 'pending' check (status in ('pending', 'paid', 'fulfilled', 'cancelled', 'refunded')),
  stripe_session_id        text,
  stripe_payment_intent_id text,
  notes                    text,
  paid_at                  timestamptz,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create index if not exists orders_tenant_idx on public.orders (tenant_id);
create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_created_at_idx on public.orders (created_at desc);

-- ── Order Items ──────────────────────────────────────────────────────────────
create table if not exists public.order_items (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references public.orders(id) on delete cascade,
  product_id  uuid references public.products(id) on delete set null,
  name        text not null,
  price       numeric(12,2) not null,
  quantity    integer not null default 1,
  created_at  timestamptz not null default now()
);

create index if not exists order_items_order_idx on public.order_items (order_id);

-- ── Stock decrement helper ───────────────────────────────────────────────────
-- Atomically decrement a product's stock, never below zero. Used by the
-- Stripe webhook when an order is paid.
create or replace function public.decrement_product_stock(p_product_id uuid, p_qty integer)
returns void language plpgsql as $$
begin
  update public.products
     set stock_quantity = greatest(0, stock_quantity - p_qty),
         updated_at = now()
   where id = p_product_id and manage_stock = true;
end;
$$;

-- ── updated_at triggers (reuses public.touch_updated_at from migration 002) ───
drop trigger if exists products_touch on public.products;
create trigger products_touch
  before update on public.products
  for each row execute function public.touch_updated_at();

drop trigger if exists orders_touch on public.orders;
create trigger orders_touch
  before update on public.orders
  for each row execute function public.touch_updated_at();

-- ── Access ────────────────────────────────────────────────────────────────────
-- This app does NOT use RLS — every table relies on the service-role server
-- client plus app-level auth (admin checks in API routes). Match that model:
-- leave RLS disabled and grant the standard Supabase roles so the server client
-- (and the public storefront read path) can access these tables.
grant all privileges on table public.products to anon, authenticated, service_role;
grant all privileges on table public.orders to anon, authenticated, service_role;
grant all privileges on table public.order_items to anon, authenticated, service_role;
grant execute on function public.decrement_product_stock(uuid, integer) to anon, authenticated, service_role;

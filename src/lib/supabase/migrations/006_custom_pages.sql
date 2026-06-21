-- Custom pages: per-tenant page builder. Admins author raw HTML/CSS starting
-- from a template, then publish. A published page can override the public
-- homepage (is_homepage) and is always reachable at /p/[slug].
-- HTML is sanitized at render time in the app, not stored sanitized.

create table if not exists public.custom_pages (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid references public.tenants(id) on delete cascade,
  slug        text not null,
  title       text not null,
  html        text not null default '',
  css         text not null default '',
  template    text not null default 'blank',
  status      text not null default 'draft' check (status in ('draft', 'published')),
  is_homepage boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (tenant_id, slug)
);

create index if not exists custom_pages_tenant_idx on public.custom_pages (tenant_id);
create index if not exists custom_pages_status_idx on public.custom_pages (status);

-- At most one homepage per tenant.
create unique index if not exists custom_pages_one_homepage_idx
  on public.custom_pages (tenant_id)
  where is_homepage = true;

-- updated_at trigger (reuses public.touch_updated_at from migration 002)
drop trigger if exists custom_pages_touch on public.custom_pages;
create trigger custom_pages_touch
  before update on public.custom_pages
  for each row execute function public.touch_updated_at();

-- Access: no RLS (matches the rest of this app — service-role server client +
-- app-level auth). Grant the standard Supabase roles.
grant all privileges on table public.custom_pages to anon, authenticated, service_role;

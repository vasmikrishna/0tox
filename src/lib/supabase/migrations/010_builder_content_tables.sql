-- Builder content tables: super-admin-managed templates, reference sites,
-- and color palettes used by the self-serve website builder.
-- All gated by status = 'approved' before surfacing to builder users.

-- ---------------------------------------------------------------------------
-- Section Templates: reusable page sections (hero, about, services, etc.)
-- ---------------------------------------------------------------------------

create table if not exists public.section_templates (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  section_type  text not null,
  description   text not null default '',
  html          text not null,
  css           text not null default '',
  preview_url   text,
  tags          text[] not null default '{}',
  sort_order    integer not null default 0,
  status        text not null default 'draft'
                  check (status in ('draft', 'approved', 'archived')),
  created_by    text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists section_templates_status_idx
  on public.section_templates (status);
create index if not exists section_templates_sort_idx
  on public.section_templates (sort_order);
create index if not exists section_templates_type_idx
  on public.section_templates (section_type);

drop trigger if exists section_templates_touch on public.section_templates;
create trigger section_templates_touch
  before update on public.section_templates
  for each row execute function public.touch_updated_at();

grant all privileges on table public.section_templates
  to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Reference Sites: full live websites for the onboarding style gallery
-- ---------------------------------------------------------------------------

create table if not exists public.reference_sites (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  description   text not null default '',
  industry      text not null default 'other',
  html          text not null,
  css           text not null default '',
  thumbnail_url text,
  sort_order    integer not null default 0,
  status        text not null default 'draft'
                  check (status in ('draft', 'approved', 'archived')),
  created_by    text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists reference_sites_status_idx
  on public.reference_sites (status);
create index if not exists reference_sites_sort_idx
  on public.reference_sites (sort_order);
create index if not exists reference_sites_industry_idx
  on public.reference_sites (industry);

drop trigger if exists reference_sites_touch on public.reference_sites;
create trigger reference_sites_touch
  before update on public.reference_sites
  for each row execute function public.touch_updated_at();

grant all privileges on table public.reference_sites
  to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Color Palettes: curated 6-color palettes for the builder
-- ---------------------------------------------------------------------------

create table if not exists public.color_palettes (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  colors        jsonb not null,
  industry      text not null default 'all',
  sort_order    integer not null default 0,
  status        text not null default 'draft'
                  check (status in ('draft', 'approved', 'archived')),
  created_by    text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists color_palettes_status_idx
  on public.color_palettes (status);
create index if not exists color_palettes_sort_idx
  on public.color_palettes (sort_order);
create index if not exists color_palettes_industry_idx
  on public.color_palettes (industry);

drop trigger if exists color_palettes_touch on public.color_palettes;
create trigger color_palettes_touch
  before update on public.color_palettes
  for each row execute function public.touch_updated_at();

grant all privileges on table public.color_palettes
  to anon, authenticated, service_role;

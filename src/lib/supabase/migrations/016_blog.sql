-- Per-tenant blog. Mirrors custom_pages (tenant-scoped, draft/published,
-- app-level admin auth) but adds a TipTap rich-text body and full SEO fields.
--
-- No RLS on this app (service-role server client + app-level auth) — grants only.

create table if not exists public.blog_posts (
  id               uuid primary key default gen_random_uuid(),
  tenant_id        uuid references public.tenants(id) on delete cascade,
  slug             text not null,
  title            text not null,
  excerpt          text not null default '',
  content_html     text not null default '',
  content_json     jsonb,
  cover_image_url  text,
  author_name      text,
  tags             text[] not null default '{}',
  status           text not null default 'draft' check (status in ('draft', 'published')),
  -- SEO
  meta_title       text,
  meta_description text,
  og_image_url     text,
  canonical_url    text,
  noindex          boolean not null default false,
  published_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (tenant_id, slug)
);

create index if not exists blog_posts_tenant_idx on public.blog_posts (tenant_id);
create index if not exists blog_posts_status_idx on public.blog_posts (status);
create index if not exists blog_posts_published_idx on public.blog_posts (published_at desc);

-- updated_at trigger (touch_updated_at() defined in migration 002)
drop trigger if exists blog_posts_touch on public.blog_posts;
create trigger blog_posts_touch
  before update on public.blog_posts
  for each row execute function public.touch_updated_at();

grant all privileges on table public.blog_posts to anon, authenticated, service_role;

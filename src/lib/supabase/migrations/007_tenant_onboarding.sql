-- Self-serve onboarding: a new tenant is created the moment a visitor claims a
-- subdomain, but its portal stays locked until they finish building their site.
-- `onboarding_complete` gates the portal; business details live in `settings`.
--
-- Existing tenants were created by the superadmin and already have a live site,
-- so backfill them to true — only brand-new self-serve tenants start at false.

alter table public.tenants
  add column if not exists onboarding_complete boolean not null default false;

update public.tenants set onboarding_complete = true where onboarding_complete = false;

-- New self-serve tenants should default to false going forward.
alter table public.tenants alter column onboarding_complete set default false;

create index if not exists tenants_onboarding_idx on public.tenants (onboarding_complete);

-- No RLS on this app (service-role server client + app-level auth) — grants only.
grant all privileges on table public.tenants to anon, authenticated, service_role;

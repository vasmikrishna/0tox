-- Allow admin-created project/service types beyond Starter, Standard, and Pro.
-- Run once in Supabase SQL editor before adding custom service types in Admin Config.

alter table public.services
  drop constraint if exists services_tier_check;

alter table public.intake_questions
  drop constraint if exists intake_questions_service_tier_check;

alter table public.stage_templates
  drop constraint if exists stage_templates_service_tier_check;

alter table public.projects
  drop constraint if exists projects_service_tier_check;

alter table public.portfolio_items
  drop constraint if exists portfolio_items_service_tier_check;

alter table public.services
  add constraint services_tier_slug_check
  check (tier ~ '^[a-z0-9]+(-[a-z0-9]+)*$');

alter table public.intake_questions
  add constraint intake_questions_service_tier_slug_check
  check (service_tier ~ '^[a-z0-9]+(-[a-z0-9]+)*$');

alter table public.stage_templates
  add constraint stage_templates_service_tier_slug_check
  check (service_tier ~ '^[a-z0-9]+(-[a-z0-9]+)*$');

alter table public.projects
  add constraint projects_service_tier_slug_check
  check (service_tier ~ '^[a-z0-9]+(-[a-z0-9]+)*$');

alter table public.portfolio_items
  add constraint portfolio_items_service_tier_slug_check
  check (service_tier is null or service_tier ~ '^[a-z0-9]+(-[a-z0-9]+)*$');

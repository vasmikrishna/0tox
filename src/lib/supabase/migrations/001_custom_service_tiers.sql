-- Allow admins to create custom project/service types.
--
-- Run this in the Supabase SQL editor if adding a service still fails with a
-- check-constraint error. Older databases limited tiers to starter/standard/pro.

do $$
declare
  constraint_record record;
begin
  for constraint_record in
    select conrelid::regclass as table_name, conname as constraint_name
    from pg_constraint
    where contype = 'c'
      and conrelid in (
        'public.services'::regclass,
        'public.projects'::regclass,
        'public.intake_questions'::regclass,
        'public.stage_templates'::regclass,
        'public.portfolio_items'::regclass
      )
      and pg_get_constraintdef(oid) ~ '(service_tier|tier)'
  loop
    execute format('alter table %s drop constraint if exists %I', constraint_record.table_name, constraint_record.constraint_name);
  end loop;
end $$;

alter table public.services
  add constraint services_tier_slug_check
  check (tier ~ '^[a-z0-9]+(-[a-z0-9]+)*$');

alter table public.projects
  add constraint projects_service_tier_slug_check
  check (service_tier ~ '^[a-z0-9]+(-[a-z0-9]+)*$');

alter table public.intake_questions
  add constraint intake_questions_service_tier_slug_check
  check (service_tier ~ '^[a-z0-9]+(-[a-z0-9]+)*$');

alter table public.stage_templates
  add constraint stage_templates_service_tier_slug_check
  check (service_tier ~ '^[a-z0-9]+(-[a-z0-9]+)*$');

alter table public.portfolio_items
  add constraint portfolio_items_service_tier_slug_check
  check (service_tier is null or service_tier ~ '^[a-z0-9]+(-[a-z0-9]+)*$');

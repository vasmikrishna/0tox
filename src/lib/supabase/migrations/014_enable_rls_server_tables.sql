-- Phase 1 of locking down direct anon-key access to the database.
--
-- Background: this app uses custom JWT auth (NOT Supabase Auth) and talks to the
-- DB with the SERVICE-ROLE server client everywhere. service_role has BYPASSRLS,
-- so enabling RLS does NOT affect the app's own server-side access. Because there
-- is no Supabase identity (auth.uid() is always null here), the only meaningful
-- RLS model is "deny anon + authenticated; service_role bypasses". Enabling RLS
-- with NO policies achieves exactly that and closes the hole where anyone holding
-- the publishable/anon key could read/write every row via the REST API.
--
-- SCOPE: only tables touched EXCLUSIVELY server-side are locked here.
--
-- DELIBERATELY EXCLUDED (still accessed directly from the browser with the anon
-- key — locking them now would break live features). These will be locked in a
-- follow-up once those components are moved to server API routes:
--   projects, stages, payments        -- admin/projects/[id]/actions.tsx (insert/update/delete)
--   intake_questions, stage_templates -- admin/config/intake/page.tsx (select)
--
-- Reversible with: alter table public.<name> disable row level security;

alter table public.users                  enable row level security;
alter table public.tenants                enable row level security;
alter table public.subscriptions          enable row level security;
alter table public.audit_logs             enable row level security;
alter table public.project_assignments    enable row level security;
alter table public.deliverable_files      enable row level security;
alter table public.intake_responses       enable row level security;
alter table public.portfolio_items        enable row level security;
alter table public.contact_enquiries      enable row level security;
alter table public.site_settings          enable row level security;
alter table public.industry_templates     enable row level security;

-- E-commerce
alter table public.products               enable row level security;
alter table public.orders                 enable row level security;
alter table public.order_items            enable row level security;

-- Site builder / content
alter table public.custom_pages           enable row level security;
alter table public.reference_sites        enable row level security;
alter table public.color_palettes         enable row level security;
alter table public.section_templates      enable row level security;
alter table public.page_templates_gallery enable row level security;

-- Bookings
alter table public.bookings               enable row level security;
alter table public.calendar_blocks        enable row level security;

-- Surveys
alter table public.surveys                enable row level security;
alter table public.survey_sections        enable row level security;
alter table public.survey_questions       enable row level security;
alter table public.survey_submissions     enable row level security;
alter table public.survey_answers         enable row level security;

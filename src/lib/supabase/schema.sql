-- =============================================
-- 0toX — Supabase Schema
-- Run this in Supabase SQL editor
-- =============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── Users ──────────────────────────────────────────────────────────────────
create table public.users (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null unique,
  name        text not null,
  avatar_url  text,
  role        text not null default 'client' check (role in ('client', 'admin')),
  created_at  timestamptz not null default now()
);

-- Auto-create user profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.users (id, email, name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── Services ───────────────────────────────────────────────────────────────
create table public.services (
  id          uuid primary key default uuid_generate_v4(),
  tier        text not null check (tier in ('starter', 'standard', 'pro')),
  name        text not null,
  tagline     text not null,
  description text not null,
  price_label text not null default 'Custom pricing',
  features    jsonb not null default '[]',
  active      boolean not null default true
);

insert into public.services (tier, name, tagline, description, price_label, features) values
('starter', 'Starter', 'Your first step online', 'A clean, fast 5-page website to establish your presence. Perfect for small businesses, freelancers, and personal brands.', 'Get a quote', '["Up to 5 pages", "Mobile responsive", "Contact form", "Basic SEO", "Delivered in 3–5 days", "1 revision round"]'),
('standard', 'Standard', 'A site that works harder', 'Multi-page website with animations, optional CMS, and deeper integrations. Built to convert and scale.', 'Get a quote', '["Up to 15 pages", "Animations & transitions", "Optional CMS", "Advanced SEO", "Third-party integrations", "Delivered in 7–10 days", "2 revision rounds"]'),
('pro', 'Pro', 'From idea to full product', 'Complete web application with user login, dashboards, databases, and custom features. Zero to X.', 'Get a quote', '["Full web app", "User authentication", "Database & storage", "Admin dashboard", "Custom features", "Delivered in 14–21 days", "3 revision rounds"]);

-- ── Intake Questions ───────────────────────────────────────────────────────
create table public.intake_questions (
  id          uuid primary key default uuid_generate_v4(),
  service_tier text not null check (service_tier in ('starter', 'standard', 'pro')),
  label       text not null,
  type        text not null check (type in ('text', 'textarea', 'select', 'checkbox', 'file')),
  options     jsonb,
  required    boolean not null default true,
  sort_order  integer not null default 0,
  active      boolean not null default true
);

-- Starter questions
insert into public.intake_questions (service_tier, label, type, required, sort_order) values
('starter', 'Business name', 'text', true, 1),
('starter', 'What does your business do? (1–2 sentences)', 'textarea', true, 2),
('starter', 'Who is your target audience?', 'textarea', true, 3),
('starter', 'Do you have a logo and brand colors?', 'select', true, 4),
('starter', 'List the 5 pages you need (e.g. Home, About, Services, Contact, Blog)', 'textarea', true, 5),
('starter', 'Do you have copy (text) ready, or do we write it?', 'select', true, 6),
('starter', 'Share 2–3 websites you like the style of', 'textarea', false, 7),
('starter', 'Any specific features? (e.g. booking form, map, gallery)', 'textarea', false, 8),
('starter', 'What is your target launch date?', 'text', false, 9);

-- Update options for select questions
update public.intake_questions set options = '["Yes, I have logo + colors", "I have a logo only", "I need branding help"]'
where service_tier = 'starter' and label = 'Do you have a logo and brand colors?';

update public.intake_questions set options = '["Copy is ready", "I need help writing it", "Mix of both"]'
where service_tier = 'starter' and label = 'Do you have copy (text) ready, or do we write it?';

-- Standard questions (inherits starter + extras)
insert into public.intake_questions (service_tier, label, type, required, sort_order) values
('standard', 'Business name', 'text', true, 1),
('standard', 'What does your business do?', 'textarea', true, 2),
('standard', 'Target audience', 'textarea', true, 3),
('standard', 'Do you have branding assets?', 'select', true, 4),
('standard', 'List all pages / sections needed', 'textarea', true, 5),
('standard', 'Copy status', 'select', true, 6),
('standard', 'Reference sites you like', 'textarea', false, 7),
('standard', 'Do you need a blog or CMS so you can update content yourself?', 'select', true, 8),
('standard', 'Any integrations needed? (booking, payments, maps, live chat, etc.)', 'textarea', false, 9),
('standard', 'Any animations or interactive elements you envision?', 'textarea', false, 10),
('standard', 'Target launch date', 'text', false, 11);

update public.intake_questions set options = '["Yes, I have logo + colors", "I have a logo only", "I need branding help"]'
where service_tier = 'standard' and label = 'Do you have branding assets?';
update public.intake_questions set options = '["Copy is ready", "I need help writing it", "Mix of both"]'
where service_tier = 'standard' and label = 'Copy status';
update public.intake_questions set options = '["Yes, I want a CMS", "No, static is fine", "Not sure"]'
where service_tier = 'standard' and label = 'Do you need a blog or CMS so you can update content yourself?';

-- Pro questions
insert into public.intake_questions (service_tier, label, type, required, sort_order) values
('pro', 'Product / app name', 'text', true, 1),
('pro', 'What problem does this product solve?', 'textarea', true, 2),
('pro', 'Who are the users?', 'textarea', true, 3),
('pro', 'What are the top 5 features for v1?', 'textarea', true, 4),
('pro', 'What user roles are needed?', 'select', true, 5),
('pro', 'What login methods do you want?', 'select', true, 6),
('pro', 'Describe the main data (what does a user own or create)?', 'textarea', true, 7),
('pro', 'Do you need payments inside the app?', 'select', true, 8),
('pro', 'Any third-party integrations? (APIs, tools, services)', 'textarea', false, 9),
('pro', 'Do you have wireframes, mockups, or design references?', 'file', false, 10),
('pro', 'Target launch date', 'text', false, 11);

update public.intake_questions set options = '["Just one (user)", "Two (user + admin)", "Multiple custom roles"]'
where service_tier = 'pro' and label = 'What user roles are needed?';
update public.intake_questions set options = '["Email + password", "Google login", "Both"]'
where service_tier = 'pro' and label = 'What login methods do you want?';
update public.intake_questions set options = '["Yes, payments inside the app", "No", "Not sure yet"]'
where service_tier = 'pro' and label = 'Do you need payments inside the app?';

-- ── Stage Templates ────────────────────────────────────────────────────────
create table public.stage_templates (
  id          uuid primary key default uuid_generate_v4(),
  service_tier text not null check (service_tier in ('starter', 'standard', 'pro')),
  name        text not null,
  description text,
  sort_order  integer not null default 0
);

insert into public.stage_templates (service_tier, name, description, sort_order) values
('starter', 'Discovery & Intake', 'Review requirements and finalise scope', 1),
('starter', 'Design System', 'Create visual direction and design assets', 2),
('starter', 'Page Build', 'Develop all pages', 3),
('starter', 'QA & Review', 'Test across devices and browsers', 4),
('starter', 'Launch', 'Deploy to production and hand off', 5),

('standard', 'Discovery & Intake', 'Review requirements and finalise scope', 1),
('standard', 'Design System & Wireframes', 'Brand identity and page wireframes', 2),
('standard', 'Core Pages Build', 'Develop main pages and layout', 3),
('standard', 'Inner Pages & Integrations', 'Secondary pages and third-party wiring', 4),
('standard', 'CMS Setup', 'Configure content management if required', 5),
('standard', 'QA & Review', 'Cross-device testing and review', 6),
('standard', 'SEO & Performance', 'Optimise metadata, images, and speed', 7),
('standard', 'Launch', 'Deploy and hand off', 8),

('pro', 'Discovery & Scoping', 'Finalise feature list, user flows, and data model', 1),
('pro', 'Design System & UX', 'UI design, component library, and user flows', 2),
('pro', 'Auth & Infrastructure', 'Login, roles, database, and hosting setup', 3),
('pro', 'Core Feature Build', 'Primary feature development', 4),
('pro', 'Dashboard & Portal', 'User dashboard and management views', 5),
('pro', 'Integrations & Payments', 'Third-party APIs and payment flows', 6),
('pro', 'QA & Security Review', 'Full testing, security checks, and fixes', 7),
('pro', 'Launch & Handoff', 'Deploy, document, and hand over credentials', 8);

-- ── Projects ───────────────────────────────────────────────────────────────
create table public.projects (
  id           uuid primary key default uuid_generate_v4(),
  client_id    uuid not null references public.users(id),
  title        text not null,
  service_tier text not null check (service_tier in ('starter', 'standard', 'pro')),
  status       text not null default 'intake' check (status in ('intake', 'review', 'active', 'completed', 'cancelled')),
  admin_notes  text,
  created_at   timestamptz not null default now(),
  started_at   timestamptz,
  completed_at timestamptz
);

-- ── Intake Responses ───────────────────────────────────────────────────────
create table public.intake_responses (
  id          uuid primary key default uuid_generate_v4(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  question_id uuid not null references public.intake_questions(id),
  answer      text,
  file_urls   jsonb default '[]',
  created_at  timestamptz not null default now()
);

-- ── Stages ─────────────────────────────────────────────────────────────────
create table public.stages (
  id                uuid primary key default uuid_generate_v4(),
  project_id        uuid not null references public.projects(id) on delete cascade,
  name              text not null,
  description       text,
  status            text not null default 'pending' check (status in ('pending', 'in_progress', 'completed')),
  visible_to_client boolean not null default false,
  due_date          date,
  completed_at      timestamptz,
  sort_order        integer not null default 0
);

-- ── Deliverable Files ──────────────────────────────────────────────────────
create table public.deliverable_files (
  id          uuid primary key default uuid_generate_v4(),
  stage_id    uuid not null references public.stages(id) on delete cascade,
  name        text not null,
  url         text not null,
  size        bigint not null default 0,
  uploaded_at timestamptz not null default now()
);

-- ── Payments ───────────────────────────────────────────────────────────────
create table public.payments (
  id                        uuid primary key default uuid_generate_v4(),
  project_id                uuid not null references public.projects(id) on delete cascade,
  label                     text not null,
  amount                    numeric(12,2) not null,
  status                    text not null default 'pending' check (status in ('pending', 'paid', 'overdue')),
  method                    text check (method in ('stripe', 'bank_transfer', 'other')),
  due_date                  date,
  paid_at                   timestamptz,
  stripe_payment_intent_id  text,
  notes                     text
);

-- ── Portfolio ──────────────────────────────────────────────────────────────
create table public.portfolio_items (
  id          uuid primary key default uuid_generate_v4(),
  title       text not null,
  description text,
  service_tier text check (service_tier in ('starter', 'standard', 'pro')),
  tags        jsonb default '[]',
  image_url   text not null,
  live_url    text,
  visible     boolean not null default true,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

-- ── Row Level Security ─────────────────────────────────────────────────────
alter table public.users enable row level security;
alter table public.projects enable row level security;
alter table public.intake_responses enable row level security;
alter table public.stages enable row level security;
alter table public.deliverable_files enable row level security;
alter table public.payments enable row level security;
alter table public.portfolio_items enable row level security;
alter table public.services enable row level security;
alter table public.intake_questions enable row level security;
alter table public.stage_templates enable row level security;

-- Users: see own profile; admin sees all
create policy "Users see own profile" on public.users
  for select using (auth.uid() = id);
create policy "Admin sees all users" on public.users
  for all using (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'));
create policy "Users update own profile" on public.users
  for update using (auth.uid() = id);

-- Projects: client sees own; admin sees all
create policy "Client sees own projects" on public.projects
  for select using (client_id = auth.uid());
create policy "Client creates projects" on public.projects
  for insert with check (client_id = auth.uid());
create policy "Admin manages all projects" on public.projects
  for all using (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'));

-- Intake responses: follow project access
create policy "Client sees own intake responses" on public.intake_responses
  for select using (exists (select 1 from public.projects p where p.id = project_id and p.client_id = auth.uid()));
create policy "Client creates intake responses" on public.intake_responses
  for insert with check (exists (select 1 from public.projects p where p.id = project_id and p.client_id = auth.uid()));
create policy "Admin manages all intake responses" on public.intake_responses
  for all using (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'));

-- Stages: client sees only visible stages
create policy "Client sees visible stages" on public.stages
  for select using (
    visible_to_client = true and
    exists (select 1 from public.projects p where p.id = project_id and p.client_id = auth.uid())
  );
create policy "Admin manages all stages" on public.stages
  for all using (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'));

-- Deliverable files: follow stage visibility
create policy "Client sees deliverables of visible stages" on public.deliverable_files
  for select using (
    exists (
      select 1 from public.stages s
      join public.projects p on p.id = s.project_id
      where s.id = stage_id and s.visible_to_client = true and p.client_id = auth.uid()
    )
  );
create policy "Admin manages all deliverable files" on public.deliverable_files
  for all using (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'));

-- Payments: client sees own
create policy "Client sees own payments" on public.payments
  for select using (exists (select 1 from public.projects p where p.id = project_id and p.client_id = auth.uid()));
create policy "Admin manages all payments" on public.payments
  for all using (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'));

-- Public readable: portfolio, services, intake questions, stage templates
create policy "Public reads visible portfolio" on public.portfolio_items
  for select using (visible = true);
create policy "Admin manages portfolio" on public.portfolio_items
  for all using (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'));

create policy "Public reads active services" on public.services
  for select using (active = true);
create policy "Admin manages services" on public.services
  for all using (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'));

create policy "Authenticated reads intake questions" on public.intake_questions
  for select using (auth.uid() is not null and active = true);
create policy "Admin manages intake questions" on public.intake_questions
  for all using (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'));

create policy "Admin manages stage templates" on public.stage_templates
  for all using (exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin'));

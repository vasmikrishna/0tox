-- =============================================
-- 003 — Employee Role + Audit Logging
-- Run this in Supabase SQL editor
-- =============================================

-- ── 1. Allow 'employee' role on users ────────────────────────────────────
alter table public.users
  drop constraint if exists users_role_check;
alter table public.users
  add constraint users_role_check check (role in ('client', 'admin', 'employee'));

-- ── 2. Project Assignments ────────────────────────────────────────────────
create table if not exists public.project_assignments (
  id          uuid primary key default uuid_generate_v4(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  employee_id uuid not null references public.users(id) on delete cascade,
  assigned_by uuid references public.users(id) on delete set null,
  assigned_at timestamptz not null default now(),
  unique(project_id, employee_id)
);

alter table public.project_assignments enable row level security;

create policy "Employee sees own assignments" on public.project_assignments
  for select using (employee_id = auth.uid());

create policy "Admin manages all assignments" on public.project_assignments
  for all using (
    exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin')
  );

-- ── 3. Employee RLS on existing tables ───────────────────────────────────
create policy "Employee sees assigned projects" on public.projects
  for select using (
    exists (
      select 1 from public.project_assignments a
      where a.project_id = id and a.employee_id = auth.uid()
    )
  );

create policy "Employee sees stages of assigned projects" on public.stages
  for select using (
    exists (
      select 1 from public.project_assignments a
      where a.project_id = project_id and a.employee_id = auth.uid()
    )
  );

create policy "Employee sees deliverables of assigned projects" on public.deliverable_files
  for select using (
    exists (
      select 1 from public.stages s
      join public.project_assignments a on a.project_id = s.project_id
      where s.id = stage_id and a.employee_id = auth.uid()
    )
  );

create policy "Employee sees intake responses of assigned projects" on public.intake_responses
  for select using (
    exists (
      select 1 from public.project_assignments a
      where a.project_id = project_id and a.employee_id = auth.uid()
    )
  );

-- ── 4. Audit Logs ─────────────────────────────────────────────────────────
create table if not exists public.audit_logs (
  id          uuid primary key default uuid_generate_v4(),
  project_id  uuid references public.projects(id) on delete cascade,
  user_id     uuid references public.users(id) on delete set null,
  user_email  text not null,
  action      text not null,
  entity_type text,
  entity_id   text,
  changes     jsonb,
  created_at  timestamptz not null default now()
);

alter table public.audit_logs enable row level security;

create policy "Admin reads all audit logs" on public.audit_logs
  for select using (
    exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin')
  );

-- Service role bypasses RLS for inserts
create policy "Service role inserts audit logs" on public.audit_logs
  for insert with check (true);

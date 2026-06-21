-- =============================================
-- 004 — Client & Employee Audit Logs Policy
-- Run this in Supabase SQL editor
-- =============================================

drop policy if exists "Client reads audit logs of own projects" on public.audit_logs;
drop policy if exists "Employee reads audit logs of assigned projects" on public.audit_logs;

create policy "Client reads audit logs of own projects" on public.audit_logs
  for select using (
    exists (
      select 1 from public.projects p
      where p.id = project_id and p.client_id = auth.uid()
    )
  );

create policy "Employee reads audit logs of assigned projects" on public.audit_logs
  for select using (
    exists (
      select 1 from public.project_assignments a
      where a.project_id = project_id and a.employee_id = auth.uid()
    )
  );

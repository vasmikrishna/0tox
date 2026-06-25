-- 018_tenant_contact_phone.sql
-- Issue #11: collect a mobile number during signup/onboarding.
-- Mirrors the existing tenants.contact_email so the business has a reachable
-- phone. The owner's number is also stored on users.phone (migration 017).
-- No RLS on this app (service-role server client); existing grants cover it.
alter table public.tenants add column if not exists contact_phone text;

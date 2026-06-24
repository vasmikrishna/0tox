-- 017_user_phone.sql
-- Issue #9: collect & store an optional phone number on the user record.
-- Login remains email + password — the login form just captures the phone and
-- the /api/auth/login route persists it to the matched user(s).
--
-- No RLS on this app (service-role server client + app-level auth); the existing
-- table grants already cover the new column, so no extra grants are needed.

alter table public.users add column if not exists phone text;

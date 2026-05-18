-- Contact enquiries: leads submitted via the public /contact form.
-- Admin-only access; service-role insert via API.

create table if not exists public.contact_enquiries (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  email       text not null,
  phone       text,
  service     text, -- 'it' | 'web' | 'ms365' | 'other' (free text)
  message     text not null,
  status      text not null default 'new' check (status in ('new', 'read', 'replied', 'archived')),
  admin_note  text,
  ip_address  text,
  user_agent  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists contact_enquiries_status_idx on public.contact_enquiries (status);
create index if not exists contact_enquiries_created_at_idx on public.contact_enquiries (created_at desc);

-- RLS: enabled but no policies — only service role (admin API) can read/write.
alter table public.contact_enquiries enable row level security;

-- Auto-update updated_at
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists contact_enquiries_touch on public.contact_enquiries;
create trigger contact_enquiries_touch
  before update on public.contact_enquiries
  for each row execute function public.touch_updated_at();

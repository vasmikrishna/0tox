-- Link bookings to a registered customer (the unified-account feature). Bookings
-- can still be made by guests, so customer_id is nullable; it's set at creation
-- when the requester is signed into this tenant. Existing rows are backfilled by
-- matching email within the same tenant.

alter table public.bookings
  add column if not exists customer_id uuid references public.users(id) on delete set null;

create index if not exists bookings_customer_id_idx on public.bookings(customer_id);

update public.bookings b
set customer_id = u.id
from public.users u
where b.customer_id is null
  and b.customer_email is not null
  and b.tenant_id is not null
  and u.email = b.customer_email
  and u.tenant_id = b.tenant_id;

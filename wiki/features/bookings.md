# Bookings (appointments + calendar blocking)

Per-tenant appointment management with two modes, surfaced as tabs on one admin page: manage customer bookings, and block out time when the business is unavailable.

## Data model
- **bookings** — `customer_name, customer_email, customer_phone, service, starts_at, ends_at, status (pending|confirmed|completed|cancelled), notes`. Tenant-scoped; indexed on `tenant_id`, `status`, `starts_at`. `updated_at` maintained by the `touch_updated_at()` trigger.
- **calendar_blocks** — `title, starts_at, ends_at, all_day`. Tenant-scoped; indexed on `tenant_id` and `(starts_at, ends_at)`.

Both tables: RLS **disabled** + `grant all to anon, authenticated, service_role` (project convention — custom JWT auth, service-role server client everywhere). Migration `008_bookings.sql`.

## Surfaces
| Area | Path |
|------|------|
| Admin page (two tabs) | `/admin/bookings` |
| Booking management tab | list + status filters, new-booking form, confirm/complete/cancel, delete |
| Block-the-calendar tab | add a blocked range (one-off or all-day), list, delete |
| Public self-booking | `/book` — customer picks service + date/time + duration; request created as `pending` |
| Public booking APIs | `GET /api/book` (upcoming blocks + busy slots), `POST /api/book` (create with conflict check) |
| Booking APIs | `GET/POST /api/admin/bookings`, `PATCH/DELETE /api/admin/bookings/[id]` |
| Calendar-block APIs | `GET/POST /api/admin/calendar-blocks`, `DELETE /api/admin/calendar-blocks/[id]` |

Admin routes are admin-only (`getSession().role === "admin"`). `/api/book` is public. All list/create are tenant-scoped via `getCurrentTenant()`.

## Conflict enforcement
`POST /api/book` rejects (**409**) any request whose `[starts_at, ends_at)` overlaps either a `calendar_blocks` row or a live booking (`pending`/`confirmed`) for the tenant. Overlap rule: `existing.starts_at < req.ends_at AND existing.ends_at > req.starts_at`. All-day blocks are stored as full-day timestamp ranges (`T00:00:00`–`T23:59:59`) so they participate in the same check. The public form also does a client-side soft warning, but the server is the source of truth. The **admin** create endpoint intentionally does *not* enforce conflicts — admins can double-book/override.

## Status lifecycle
`pending → confirmed → completed`, with `cancelled` reachable from pending/confirmed. The management tab shows only the valid next action per row. Tab badges show per-status counts.

## Feature flag
`FEATURES.bookings` in `src/lib/features.ts` (default **on**). When off: sidebar link hidden (`portal-sidebar.tsx`) and `/admin/bookings` + `/book` redirect (`middleware.ts`). Code and data remain in place.

## Notes / future
- No availability/working-hours config yet — customers can request any future time; conflicts with blocks/bookings are rejected but there's no positive "here are the open slots" calendar view.
- No email confirmation is sent on booking yet (admin sees it as `pending`); wiring `src/lib/email` like the contact form does is the natural next step.
- Duration choices are fixed (30/60/90/120 min) on the public form.

# NexoIT Client Portal — Project Brief

## Overview

**NexoIT** is an agency client portal built with Next.js 15 (App Router). It has two portals:
- **Admin portal** — for the agency owner to manage clients, projects, stages, payments, portfolio, and intake form config
- **Client portal** — for clients to register, submit project intake, track progress, and pay invoices

**GitHub:** `git@github.com:vasmikrishna/0tox.git`  
**Local path:** `/Users/vamsikrishnavh/Documents/Projects/0tox`  
**Dev server:** `npm run dev` → `http://localhost:3000`

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15.2.6, App Router, TypeScript |
| Styling | Tailwind CSS v4, shadcn/ui components |
| Database | Supabase (Postgres only — NOT using Supabase Auth) |
| Auth | Custom JWT via `jose` (SignJWT / jwtVerify), HTTP-only cookie named `session` |
| Password hashing | `bcryptjs` |
| Payments | Stripe (checkout + webhook) |
| Email | Resend |
| Deployment | Not yet deployed |

---

## Auth Architecture

### How it works
- JWT stored in HTTP-only cookie `session` (30-day expiry)
- Signed with `SESSION_SECRET` env var using HS256
- `src/lib/session.ts` — `createSession()`, `getSession()`, `deleteSession()`
- `src/middleware.ts` — protects `/client/*` and `/admin/*` routes, redirects logged-in users away from `/login` and `/register`

### Admin login
- Credentials from env vars: `ADMIN_EMAIL` / `ADMIN_PASSWORD`
- No database row needed — hardcoded check in `/api/auth/login`
- Creates session with `role: "admin"`

### Client login / register
- Clients stored in Supabase `users` table with `password_hash` (bcrypt, 12 rounds)
- `/api/auth/register` — validates, checks for duplicates, hashes password, inserts row, creates session
- `/api/auth/login` — looks up user, compares hash with bcrypt, creates session

### Google OAuth
- Direct OAuth 2.0 (no NextAuth/Passport)
- `/api/auth/google` — redirects to Google authorization URL
- `/api/auth/google/callback` — exchanges code for tokens, fetches user info, upserts in `users` table, creates session
- If Google email matches `ADMIN_EMAIL` → creates admin session
- **Note:** `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` env vars are placeholders — needs real values from Google Cloud Console

---

## Database Schema (Supabase)

All tables are in `public` schema with **RLS disabled** (service role key used throughout).

```sql
-- users
id uuid PK, email text UNIQUE, name text, password_hash text,
google_id text, avatar_url text, role text default 'client', created_at

-- projects
id uuid PK, client_id → users, title text, service_tier text,
status text default 'intake', admin_notes text, started_at, completed_at, created_at

-- stages
id uuid PK, project_id → projects, name text, description text,
status text default 'pending', visible_to_client boolean default true,
due_date date, completed_at, sort_order int, created_at

-- deliverable_files
id uuid PK, stage_id → stages, name text, url text, size bigint, uploaded_at

-- payments
id uuid PK, project_id → projects, label text, amount numeric(10,2),
status text default 'pending', method text, due_date date, paid_at,
stripe_payment_intent_id text, notes text, created_at

-- portfolio_items
id uuid PK, title text, description text, service_tier text,
tags text[], image_url text, live_url text, visible boolean, sort_order int, created_at

-- intake_questions
id uuid PK, service_tier text, label text, type text default 'text',
options text[], required boolean, sort_order int, active boolean, created_at

-- intake_responses
id uuid PK, project_id → projects, question_id → intake_questions,
answer text, file_urls text[], created_at
```

**TypeScript types:** `src/types/index.ts`  
**Service tiers:** `"starter" | "standard" | "pro"`  
**Project statuses:** `"intake" | "review" | "active" | "completed" | "cancelled"`  
**Stage statuses:** `"pending" | "in_progress" | "completed"`  
**Payment statuses:** `"pending" | "paid" | "overdue"`

---

## File Structure

```
src/
├── app/
│   ├── (public)/
│   │   └── page.tsx                  # Landing page (hero, services, portfolio CTA)
│   ├── (auth)/
│   │   ├── login/page.tsx            # Login: Google button + email/password form
│   │   ├── register/page.tsx         # Register: Google button + name/email/password form
│   │   └── forgot-password/page.tsx  # Forgot password (UI only, no backend yet)
│   ├── (client)/
│   │   └── client/
│   │       ├── dashboard/page.tsx    # Client dashboard: active projects, payments due
│   │       ├── projects/
│   │       │   ├── page.tsx          # List all client projects
│   │       │   ├── new/page.tsx      # 3-step new project wizard (service → details → submit)
│   │       │   └── [id]/page.tsx     # Project detail: stages, files, payments
│   │       └── layout.tsx            # Client layout with sidebar
│   ├── (admin)/
│   │   └── admin/
│   │       ├── dashboard/page.tsx    # Admin dashboard: stats, recent projects
│   │       ├── clients/
│   │       │   ├── page.tsx          # All clients list
│   │       │   └── [id]/page.tsx     # Client detail with projects and payments
│   │       ├── projects/
│   │       │   ├── page.tsx          # All projects list
│   │       │   └── [id]/page.tsx     # Project detail: manage stages, payments, notes
│   │       │       └── actions.tsx   # Server actions: update status, add stage, add payment
│   │       ├── payments/page.tsx     # All payments list
│   │       ├── portfolio/page.tsx    # Portfolio management (add/toggle visibility)
│   │       ├── config/
│   │       │   └── intake/page.tsx   # Intake question config per service tier
│   │       └── layout.tsx            # Admin layout with sidebar
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/route.ts        # POST: email/password login
│   │   │   ├── register/route.ts     # POST: create account + session
│   │   │   ├── logout/route.ts       # POST: delete session cookie
│   │   │   └── google/
│   │   │       ├── route.ts          # GET: redirect to Google OAuth
│   │   │       └── callback/route.ts # GET: handle OAuth callback
│   │   └── payments/
│   │       ├── checkout/route.ts     # POST: create Stripe checkout session
│   │       └── webhook/route.ts      # POST: handle Stripe webhook events
│   ├── layout.tsx                    # Root layout
│   └── globals.css                   # Global styles + CSS variables
├── components/
│   ├── shared/
│   │   └── portal-sidebar.tsx        # Sidebar for client and admin portals
│   └── ui/                           # shadcn/ui components (button, input, card, etc.)
├── lib/
│   ├── session.ts                    # JWT session helpers
│   ├── supabase/
│   │   ├── client.ts                 # Browser Supabase client
│   │   └── server.ts                 # Server Supabase client (service role)
│   ├── stripe.ts                     # Stripe client init
│   ├── email/index.ts                # Resend email helpers
│   ├── mock-data.ts                  # Mock data fallback when DB not configured
│   └── utils.ts                      # cn() utility
├── middleware.ts                     # Route protection
└── types/index.ts                    # All TypeScript interfaces
```

---

## Environment Variables

```bash
# .env.local

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://bxinssdjwuzfjexhzzqi.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service role key>   # used server-side, bypasses RLS

# Google OAuth (needs real values)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Stripe (needs real values)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# Resend email (needs real value)
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=noreply@nexoit.com.au

# Cloudflare R2 resource uploads
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_r2_access_key
R2_SECRET_ACCESS_KEY=your_r2_secret_key
R2_BUCKET_NAME=0tox-assets-dev
R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com

# Session secret (already set)
SESSION_SECRET=<32-byte base64 random string>

# Admin credentials
ADMIN_EMAIL=ckrishna@startensystems.com
ADMIN_PASSWORD=<admin password>

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## What's Working

- [x] Landing page with hero, services, portfolio section
- [x] Client registration (email/password → Supabase `users` table)
- [x] Client login (email/password)
- [x] Admin login (env var credentials)
- [x] Google OAuth flow (code complete, needs real `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`)
- [x] JWT session auth with middleware route protection
- [x] Client dashboard
- [x] Client project list page
- [x] New project wizard (3 steps: choose tier → name → submit)
- [x] Client project detail page
- [x] Admin dashboard with stats
- [x] Admin clients list + client detail
- [x] Admin projects list + project detail
- [x] Admin project management (update status, add stages, add payments, admin notes)
- [x] Admin project resources (GitHub repo + related links)
- [x] Cloudflare R2 upload route for stage deliverables
- [x] Admin payments list
- [x] Admin portfolio management
- [x] Admin intake question configuration
- [x] Stripe checkout + webhook routes (wired up, needs real Stripe keys)
- [x] Supabase database fully set up with correct schema

---

## What Needs Work / Pending

### High Priority
- [ ] **Google OAuth** — add real `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env.local` and add `http://localhost:3000/api/auth/google/callback` as authorized redirect URI in Google Cloud Console
- [ ] **Forgot password flow** — page exists but no backend (no email sending yet)
- [ ] **File uploads** — R2 upload route and admin stage upload UI are implemented; still needs real R2 env values and end-to-end upload testing
- [ ] **Stripe payments** — add real Stripe keys and test checkout flow end-to-end

### Medium Priority
- [ ] **Email notifications** — Resend is wired up but no email templates implemented (e.g., welcome email, project status change, invoice due)
- [ ] **Client settings page** — sidebar link was removed; needs `/client/settings` page for profile/password change
- [ ] **Portfolio images** — portfolio items have `image_url` but no upload UI
- [ ] **Stage templates** — admin can create stages manually but no template system (apply pre-set stages per service tier)

### Low Priority / Nice to Have
- [ ] **Pagination** — lists load all rows, no pagination
- [ ] **Search/filter** — admin project/client lists have no search
- [ ] **Real-time updates** — Supabase realtime not set up (client would need to refresh to see stage updates)
- [ ] **Deploy to production** — not deployed yet; recommended: Vercel for Next.js

---

## Key Patterns & Conventions

### Supabase usage
- Always use `SUPABASE_SERVICE_ROLE_KEY` server-side (bypasses RLS)
- Client: `src/lib/supabase/server.ts` → `createServerClient()`
- Never use Supabase Auth — it's just a Postgres database here

### Supabase guard pattern
Most data-fetching pages check if Supabase is configured and fall back to mock data:
```ts
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
if (!supabaseUrl?.startsWith('http')) {
  // render with mock data from src/lib/mock-data.ts
}
```

### Session in server components / API routes
```ts
import { getSession } from "@/lib/session"
const user = await getSession()
if (!user) redirect("/login")
```

### All pages are React Server Components except:
- Auth pages (`(auth)/`) — use client state for forms
- New project wizard — multi-step client state
- Admin actions in project detail — `"use client"` for mutations

---

## Running Locally

```bash
cd /Users/vamsikrishnavh/Documents/Projects/0tox
npm install
npm run dev
# → http://localhost:3000
```

Admin login: use `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env.local`  
Client: register at `/register`

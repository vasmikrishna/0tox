import type { Project, Stage, Payment, PortfolioItem, User } from "@/types"

export const MOCK_CLIENTS: User[] = [
  { id: "u1", email: "alex@burgerking.com", name: "Alex Johnson", role: "client", created_at: "2026-04-10T09:00:00Z" },
  { id: "u2", email: "sarah@techflow.io", name: "Sarah Mitchell", role: "client", created_at: "2026-04-18T11:30:00Z" },
  { id: "u3", email: "raj@freshbrew.in", name: "Raj Patel", role: "client", created_at: "2026-05-02T08:15:00Z" },
]

export const MOCK_PROJECTS: (Project & { client?: User })[] = [
  {
    id: "p1", client_id: "u1", title: "Burger King Fan Site", service_tier: "starter",
    status: "completed", created_at: "2026-04-11T10:00:00Z", started_at: "2026-04-12T10:00:00Z",
    completed_at: "2026-04-16T16:00:00Z", client: MOCK_CLIENTS[0],
  },
  {
    id: "p2", client_id: "u2", title: "TechFlow SaaS Platform", service_tier: "pro",
    status: "active", created_at: "2026-04-20T09:00:00Z", started_at: "2026-04-22T09:00:00Z",
    client: MOCK_CLIENTS[1],
  },
  {
    id: "p3", client_id: "u3", title: "FreshBrew Coffee Website", service_tier: "standard",
    status: "review", created_at: "2026-05-03T14:00:00Z", client: MOCK_CLIENTS[2],
  },
]

export const MOCK_STAGES: (Stage & { deliverable_files: any[] })[] = [
  { id: "s1", project_id: "p2", name: "Discovery & Scoping", description: "Finalised feature list, user flows, and data model", status: "completed", visible_to_client: true, completed_at: "2026-04-25T17:00:00Z", sort_order: 1, deliverable_files: [{ id: "f1", stage_id: "s1", name: "Scope Doc v1.pdf", url: "#", size: 204800, uploaded_at: "2026-04-25T17:00:00Z" }] },
  { id: "s2", project_id: "p2", name: "Design System & UX", description: "UI design, component library, and user flows", status: "completed", visible_to_client: true, completed_at: "2026-04-30T12:00:00Z", sort_order: 2, deliverable_files: [{ id: "f2", stage_id: "s2", name: "Design System.zip", url: "#", size: 5242880, uploaded_at: "2026-04-30T12:00:00Z" }] },
  { id: "s3", project_id: "p2", name: "Auth & Infrastructure", description: "Login, roles, database, and hosting setup", status: "in_progress", visible_to_client: true, sort_order: 3, deliverable_files: [] },
  { id: "s4", project_id: "p2", name: "Core Feature Build", description: "Primary feature development", status: "pending", visible_to_client: false, sort_order: 4, deliverable_files: [] },
  { id: "s5", project_id: "p2", name: "Dashboard & Portal", description: "User dashboard and management views", status: "pending", visible_to_client: false, sort_order: 5, deliverable_files: [] },
  { id: "s6", project_id: "p2", name: "QA & Launch", description: "Testing, final fixes, and deployment", status: "pending", visible_to_client: false, sort_order: 6, deliverable_files: [] },
]

export const MOCK_PAYMENTS: Payment[] = [
  { id: "pay1", project_id: "p2", label: "50% Deposit", amount: 2500, status: "paid", method: "stripe", paid_at: "2026-04-21T10:00:00Z" },
  { id: "pay2", project_id: "p2", label: "Milestone — Design Complete", amount: 1500, status: "paid", method: "bank_transfer", paid_at: "2026-05-01T14:00:00Z" },
  { id: "pay3", project_id: "p2", label: "Final Payment", amount: 1000, status: "pending", method: "stripe", due_date: "2026-06-01" },
  { id: "pay4", project_id: "p1", label: "Full Payment", amount: 800, status: "paid", method: "stripe", paid_at: "2026-04-12T09:00:00Z" },
]

export const MOCK_PORTFOLIO: PortfolioItem[] = [
  { id: "port1", title: "Burger King Fan Site", description: "Fast 5-page brochure site with menu and contact form.", service_tier: "starter", tags: ["Next.js", "Tailwind", "Vercel"], image_url: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800&q=80", live_url: "https://burgerking.com", visible: true, sort_order: 1, created_at: "2026-04-16T16:00:00Z" },
  { id: "port2", title: "TechFlow SaaS", description: "Full web app with auth, dashboard, and Stripe payments.", service_tier: "pro", tags: ["Next.js", "Supabase", "Stripe"], image_url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80", live_url: "https://techflow.io", visible: true, sort_order: 2, created_at: "2026-05-01T12:00:00Z" },
  { id: "port3", title: "Zenko Yoga Studio", description: "Multi-page site with class booking and CMS.", service_tier: "standard", tags: ["Next.js", "Contentlayer", "Booking"], image_url: "https://images.unsplash.com/photo-1588286840104-8957b019727f?w=800&q=80", live_url: "https://zenkoyoga.com.au", visible: true, sort_order: 3, created_at: "2026-03-20T10:00:00Z" },
]

export const MOCK_INTAKE_RESPONSES = [
  { id: "r1", project_id: "p2", question_id: "q1", answer: "TechFlow", intake_questions: { label: "Product / app name" } },
  { id: "r2", project_id: "p2", question_id: "q2", answer: "A project management tool for remote engineering teams. We need task boards, time tracking, and integrations with GitHub and Slack.", intake_questions: { label: "What problem does this product solve?" } },
  { id: "r3", project_id: "p2", question_id: "q3", answer: "Software engineers and engineering managers at companies with 10–100 employees.", intake_questions: { label: "Who are the users?" } },
  { id: "r4", project_id: "p2", question_id: "q4", answer: "1. Task board (Kanban)\n2. Time tracking per task\n3. GitHub PR linking\n4. Team dashboard\n5. Slack notifications", intake_questions: { label: "What are the top 5 features for v1?" } },
  { id: "r5", project_id: "p2", question_id: "q5", answer: "Two (user + admin)", intake_questions: { label: "What user roles are needed?" } },
  { id: "r6", project_id: "p2", question_id: "q6", answer: "Both", intake_questions: { label: "What login methods do you want?" } },
]

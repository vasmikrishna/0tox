import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { createClient } from "@/lib/supabase/server"

const SUPER_ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@0tox.com"

async function assertSuperAdmin() {
  const session = await getSession()
  if (!session || session.email !== SUPER_ADMIN_EMAIL) return null
  return session
}

export async function GET() {
  // In dev, allow unauthenticated read so the login page tenant-switcher can list tenants
  if (process.env.NODE_ENV !== "development") {
    if (!await assertSuperAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const supabase = createClient()
  const { data, error } = await (supabase as any).from("tenants").select("*").order("created_at", { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ tenants: data ?? [] })
}

export async function POST(req: Request) {
  if (!await assertSuperAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await req.json()
  const { name, slug, industry, plan = "starter", contact_email, primary_color = "#1B3A6B" } = body

  if (!name || !slug || !industry) return NextResponse.json({ error: "name, slug, industry required" }, { status: 400 })

  const supabase = createClient()

  // Create tenant
  const { data: tenant, error: tErr } = await (supabase as any)
    .from("tenants")
    .insert({ name, slug, industry, plan, status: "active", contact_email: contact_email || null, primary_color })
    .select()
    .single()

  if (tErr || !tenant) return NextResponse.json({ error: tErr?.message ?? "Failed to create tenant" }, { status: 500 })

  // Seed industry templates for this tenant
  const { data: templates } = await (supabase as any)
    .from("industry_templates")
    .select("*")
    .eq("industry", industry)
    .order("sort_order")

  const packages = (templates ?? []).filter((t: any) => t.type === "package")
  const stages   = (templates ?? []).filter((t: any) => t.type === "stage")
  const intake   = (templates ?? []).filter((t: any) => t.type === "intake_question")

  // Insert tenant-specific packages (stored as website settings or a packages table if exists)
  // Store as tenant settings for now — can be moved to a dedicated packages table later
  const seededSettings = {
    packages: packages.map((p: any) => p.data),
    stage_templates: stages.map((s: any) => s.data),
    intake_questions: intake.map((q: any) => q.data),
  }

  await (supabase as any)
    .from("tenants")
    .update({ settings: seededSettings })
    .eq("id", tenant.id)

  return NextResponse.json({
    tenant,
    seeded: {
      packages: packages.length,
      stages: stages.length,
      intake_questions: intake.length,
    },
  })
}

import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { getTenantById } from "@/lib/tenant"
import { generateLogoOptions, isLogoAiConfigured } from "@/lib/logo-generate"

export const runtime = "nodejs"
export const maxDuration = 120

const SUPER_ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@0tox.com"

async function assertSuperAdmin() {
  const session = await getSession()
  if (!session || session.email !== SUPER_ADMIN_EMAIL) return null
  return session
}

/**
 * POST /api/superadmin/tenants/[id]/logo/generate
 * Generate logo options for an arbitrary tenant (superadmin acting on their
 * behalf). Returns { options }.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await assertSuperAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  if (!isLogoAiConfigured()) return NextResponse.json({ error: "AI not configured" }, { status: 503 })

  const { id } = await params
  const tenant = await getTenantById(id)
  if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 })

  const body = await req.json().catch(() => ({}))

  try {
    const options = await generateLogoOptions({
      tenantId: tenant.id,
      businessName: String(body.businessName ?? tenant.name),
      category: typeof body.category === "string" ? body.category : tenant.industry,
      colors: body.colors,
      style: typeof body.style === "string" ? body.style : undefined,
      count: body.count,
    })
    return NextResponse.json({ options })
  } catch (err: unknown) {
    console.error("[superadmin/logo/generate]", err)
    return NextResponse.json(
      { error: `Logo generation failed: ${(err as Error)?.message ?? "unknown"}` },
      { status: 502 }
    )
  }
}

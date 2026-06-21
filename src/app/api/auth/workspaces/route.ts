import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { createClient } from "@/lib/supabase/server"

// Returns all workspaces (tenants) the current user belongs to
export async function GET() {
  const session = await getSession()
  if (!session || session.id === "admin") return NextResponse.json({ workspaces: [] })

  const supabase = createClient()

  const { data: memberships } = await (supabase as any)
    .from("users")
    .select("id, role, tenant_id, tenants(id, name, slug, primary_color, industry)")
    .eq("email", session.email)

  if (!memberships) return NextResponse.json({ workspaces: [] })

  const workspaces = memberships.map((m: any) => ({
    userId: m.id,
    tenantId: m.tenant_id,
    role: m.role,
    name: m.tenants?.name ?? m.tenant_id,
    slug: m.tenants?.slug ?? "",
    primary_color: m.tenants?.primary_color ?? "#6366f1",
    industry: m.tenants?.industry ?? "",
    active: m.tenant_id === session.tenant_id,
  }))

  return NextResponse.json({ workspaces })
}

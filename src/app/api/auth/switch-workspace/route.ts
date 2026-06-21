import { NextResponse } from "next/server"
import { getSession, createSession } from "@/lib/session"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: Request) {
  const session = await getSession()
  if (!session || session.id === "admin") {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const { tenantId } = await req.json()
  if (!tenantId) return NextResponse.json({ error: "tenantId required" }, { status: 400 })

  const supabase = createClient()

  // Verify user actually belongs to that tenant
  const { data: user } = await (supabase as any)
    .from("users")
    .select("id, email, name, role, tenant_id")
    .eq("email", session.email)
    .eq("tenant_id", tenantId)
    .single()

  if (!user) return NextResponse.json({ error: "You don't have access to that workspace" }, { status: 403 })

  await createSession({ id: user.id, email: user.email, name: user.name, role: user.role, tenant_id: user.tenant_id })
  return NextResponse.json({ role: user.role })
}

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getSession } from "@/lib/session"

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const tenantId = session.tenant_id

  try {
    const supabase = createClient()
    const { data, error } = await (supabase as any)
      .from("users")
      .select("id, name, email, created_at")
      .eq("role", "client")
      .eq("tenant_id", tenantId)
      .order("name", { ascending: true })

    if (error) throw error
    return NextResponse.json({ clients: data ?? [] })
  } catch (err) {
    console.error("[admin/clients] GET error:", err)
    return NextResponse.json({ error: "Failed to load clients" }, { status: 500 })
  }
}

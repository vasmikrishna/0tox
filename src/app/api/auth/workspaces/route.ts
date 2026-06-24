import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { getWorkspacesForEmail } from "@/lib/workspaces"

// Returns all workspaces (tenants) the current user belongs to
export async function GET() {
  const session = await getSession()
  if (!session || session.id === "admin") return NextResponse.json({ workspaces: [] })

  const workspaces = await getWorkspacesForEmail(session.email, session.tenant_id)
  return NextResponse.json({ workspaces })
}

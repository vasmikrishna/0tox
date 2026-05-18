import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getSession } from "@/lib/session"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await req.json()
    const updates: Record<string, any> = {}
    if (body.status) updates.status = body.status
    if (typeof body.admin_note === "string") updates.admin_note = body.admin_note

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No updates" }, { status: 400 })
    }

    const supabase = createClient()
    const { error } = await (supabase as any)
      .from("contact_enquiries")
      .update(updates)
      .eq("id", id)

    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[admin/enquiries/:id] PATCH error:", err)
    return NextResponse.json({ error: "Failed to update" }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id } = await params
    const supabase = createClient()
    const { error } = await (supabase as any)
      .from("contact_enquiries")
      .delete()
      .eq("id", id)

    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { createClient } from "@/lib/supabase/server"

export async function PATCH(req: Request) {
  const session = await getSession()
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const body = await req.json()
  const ids: string[] = body.ids ?? []
  const supabase = createClient()
  await Promise.all(ids.map((sId, index) =>
    (supabase as any).from("survey_sections").update({ sort_order: index }).eq("id", sId)
  ))
  return NextResponse.json({ ok: true })
}

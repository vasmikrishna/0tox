import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getSession } from "@/lib/session"

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const supabase = createClient()
    const { data, error } = await supabase.from("site_settings").select("key, value")
    if (error) throw error
    const settings: Record<string, string> = {}
    for (const row of (data ?? []) as { key: string; value: string }[]) {
      if (row.key) settings[row.key] = row.value ?? ""
    }
    return NextResponse.json(settings)
  } catch (err) {
    return NextResponse.json({ error: "Failed to load settings" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await getSession()
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json() as Record<string, string>
    const supabase = createClient()

    const rows = Object.entries(body).map(([key, value]) => ({ key, value })) as any[]

    const { error } = await (supabase as any)
      .from("site_settings")
      .upsert(rows, { onConflict: "key" })

    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 })
  }
}

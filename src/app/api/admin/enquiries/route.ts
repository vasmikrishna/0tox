import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getSession } from "@/lib/session"

export async function GET(req: Request) {
  const session = await getSession()
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")

    const supabase = createClient()
    let query = (supabase as any)
      .from("contact_enquiries")
      .select("*")
      .order("created_at", { ascending: false })

    if (status && status !== "all") {
      query = query.eq("status", status)
    }

    const { data, error } = await query
    if (error) throw error

    // Counts by status (for tabs)
    const { data: countData } = await (supabase as any)
      .from("contact_enquiries")
      .select("status")

    const counts = { new: 0, read: 0, replied: 0, archived: 0, all: 0 }
    for (const row of (countData ?? []) as { status: string }[]) {
      counts.all++
      if (row.status in counts) counts[row.status as keyof typeof counts]++
    }

    return NextResponse.json({ enquiries: data ?? [], counts })
  } catch (err) {
    console.error("[admin/enquiries] GET error:", err)
    return NextResponse.json({ error: "Failed to load enquiries" }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { createSession } from "@/lib/session"

export async function POST(req: Request) {
  const { name, email, password } = await req.json()

  if (!name || !email || !password) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseKey = serviceKey && !serviceKey.startsWith("your_") ? serviceKey : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl?.startsWith("http") || !supabaseKey) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 })
  }

  if (!serviceKey || serviceKey.startsWith("your_")) {
    return NextResponse.json({ error: "Registration is not available yet — service not fully configured" }, { status: 503 })
  }

  try {
    const { createClient } = await import("@supabase/supabase-js")
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Check if email already exists
    const { data: existing } = await supabase.from("users").select("id").eq("email", email).single()
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 })
    }

    const bcrypt = await import("bcryptjs")
    const password_hash = await bcrypt.hash(password, 12)

    const { data: user, error } = await supabase
      .from("users")
      .insert({ name, email, password_hash, role: "client" })
      .select("id, email, name, role")
      .single()

    if (error || !user) {
      console.error("[register] Supabase error:", error)
      const msg = error?.message?.includes("does not exist")
        ? "Database tables not set up yet — please run the SQL schema in Supabase"
        : error?.message?.includes("permission") || error?.code === "42501"
        ? "Database permission error — service role key required"
        : "Failed to create account"
      return NextResponse.json({ error: msg }, { status: 500 })
    }

    await createSession({ id: user.id, email: user.email, name: user.name, role: "client" })
    return NextResponse.json({ role: "client" })
  } catch {
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 })
  }
}

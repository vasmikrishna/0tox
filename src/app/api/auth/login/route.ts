import { NextResponse } from "next/server"
import { createSession } from "@/lib/session"

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@0tox.com"
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "admin123"

export async function POST(req: Request) {
  const { email, password } = await req.json()

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 })
  }

  // Check admin credentials first
  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    await createSession({ id: "admin", email, name: "Admin", role: "admin" })
    return NextResponse.json({ role: "admin" })
  }

  // Check client in Supabase
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (supabaseUrl?.startsWith("http") && supabaseKey) {
    try {
      const { createClient } = await import("@supabase/supabase-js")
      const supabase = createClient(supabaseUrl, supabaseKey)
      const { data: user } = await supabase
        .from("users")
        .select("id, email, name, role, password_hash")
        .eq("email", email)
        .single()

      if (user && user.password_hash) {
        const bcrypt = await import("bcryptjs")
        const valid = await bcrypt.compare(password, user.password_hash)
        if (valid) {
          await createSession({ id: user.id, email: user.email, name: user.name, role: user.role })
          return NextResponse.json({ role: user.role })
        }
      }
    } catch {}
  }

  return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
}

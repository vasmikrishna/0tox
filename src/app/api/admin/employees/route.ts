import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { createClient } from "@/lib/supabase/server"
import { randomBytes } from "node:crypto"

export async function GET() {
  const session = await getSession()
  if (session?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const tenantId = session.tenant_id

  const supabase = createClient()
  const { data, error } = await (supabase as any)
    .from("users")
    .select("id, email, name, avatar_url, role, created_at")
    .eq("role", "employee")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ employees: data ?? [] })
}

export async function POST(req: Request) {
  const session = await getSession()
  if (session?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const tenantId = session.tenant_id

  const body = await req.json()
  const name = typeof body.name === "string" ? body.name.trim() : ""
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : ""

  if (!name || !email) {
    return NextResponse.json({ error: "Name and email are required" }, { status: 400 })
  }

  const supabase = createClient()

  const { data: existing } = await (supabase as any)
    .from("users")
    .select("id")
    .eq("email", email)
    .eq("tenant_id", tenantId)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 })
  }

  const bcrypt = await import("bcryptjs")
  const tempPassword = randomBytes(9).toString("base64url")
  const password_hash = await bcrypt.hash(tempPassword, 12)

  const { data: employee, error } = await (supabase as any)
    .from("users")
    .insert({ email, name, role: "employee", password_hash, tenant_id: tenantId })
    .select("id, email, name, role, created_at")
    .single()

  if (error || !employee) {
    return NextResponse.json({ error: error?.message ?? "Failed to create employee" }, { status: 500 })
  }

  if (process.env.RESEND_API_KEY) {
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ""
      const fromEmail = process.env.RESEND_FROM_EMAIL ?? "noreply@0tox.com"
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: `0toX <${fromEmail}>`,
          to: [email],
          subject: "Your 0toX employee account",
          html: `
            <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px">
              <h2 style="color:#1B3A6B">Welcome to 0toX</h2>
              <p>Hi ${name},</p>
              <p>An admin has created an employee account for you. Use the credentials below to log in.</p>
              <div style="background:#f8f9fa;border-radius:8px;padding:16px;margin:20px 0">
                <p style="margin:0 0 8px"><strong>Email:</strong> ${email}</p>
                <p style="margin:0"><strong>Temporary password:</strong> <code style="background:#fff;padding:2px 6px;border:1px solid #e5e7eb;border-radius:4px">${tempPassword}</code></p>
              </div>
              <p>Please change your password after first login.</p>
              <p><a href="${appUrl}/login" style="display:inline-block;background:#16A34A;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600">Log in</a></p>
              <p style="color:#6b7280;font-size:12px;margin-top:24px">— The 0toX team</p>
            </div>
          `,
        }),
      })
    } catch (err) {
      console.error("[employees] welcome email failed:", err)
    }
  }

  return NextResponse.json({ employee, tempPassword })
}

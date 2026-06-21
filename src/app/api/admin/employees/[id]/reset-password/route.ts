import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { createClient } from "@/lib/supabase/server"
import { randomBytes } from "node:crypto"

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (session?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const tenantId = session.tenant_id

  const { id } = await params
  const supabase = createClient()

  // Fetch the employee first
  const { data: employee, error: fetchError } = await (supabase as any)
    .from("users")
    .select("id, email, name, role")
    .eq("id", id)
    .eq("role", "employee")
    .eq("tenant_id", tenantId)
    .single()

  if (fetchError || !employee) {
    return NextResponse.json({ error: fetchError?.message ?? "Employee not found" }, { status: 404 })
  }

  // Generate new temp password
  const bcrypt = await import("bcryptjs")
  const tempPassword = randomBytes(9).toString("base64url") // ~12 chars
  const password_hash = await bcrypt.hash(tempPassword, 12)

  // Update password in DB
  const { error: updateError } = await (supabase as any)
    .from("users")
    .update({ password_hash })
    .eq("id", id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  // Send email if API key exists
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
          to: [employee.email],
          subject: "Your 0toX password has been reset",
          html: `
            <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px">
              <h2 style="color:#1B3A6B">Password Reset</h2>
              <p>Hi ${employee.name},</p>
              <p>An admin has reset the password for your employee account. Use the temporary credentials below to log in.</p>
              <div style="background:#f8f9fa;border-radius:8px;padding:16px;margin:20px 0">
                <p style="margin:0 0 8px"><strong>Email:</strong> ${employee.email}</p>
                <p style="margin:0"><strong>Temporary password:</strong> <code style="background:#fff;padding:2px 6px;border:1px solid #e5e7eb;border-radius:4px">${tempPassword}</code></p>
              </div>
              <p>Please change your password immediately after logging in.</p>
              <p><a href="${appUrl}/login" style="display:inline-block;background:#16A34A;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600">Log in</a></p>
              <p style="color:#6b7280;font-size:12px;margin-top:24px">— The 0toX team</p>
            </div>
          `,
        }),
      })
    } catch (err) {
      console.error("[employees] reset email failed:", err)
    }
  }

  return NextResponse.json({ success: true, tempPassword })
}

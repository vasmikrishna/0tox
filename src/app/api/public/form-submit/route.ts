import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getTenantSlug, getTenantBySlug } from "@/lib/tenant"
import { sendEmail } from "@/lib/email"

export const runtime = "nodejs"

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const name = String(body.name ?? "").trim()
    const email = String(body.email ?? "").trim()
    const phone = String(body.phone ?? "").trim() || null
    const message = String(body.message ?? "").trim()
    const source = String(body.source ?? "website_form")

    if (!name || !email) {
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 })
    }
    if (!message && !phone) {
      return NextResponse.json({ error: "Please provide a message" }, { status: 400 })
    }

    const slug = await getTenantSlug()
    const tenant = await getTenantBySlug(slug)
    if (!tenant) {
      return NextResponse.json({ error: "Invalid site" }, { status: 404 })
    }

    const userAgent = req.headers.get("user-agent") ?? null
    const ipAddress =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      null

    const supabase = createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("contact_enquiries")
      .insert({
        tenant_id: tenant.id,
        name,
        email,
        phone,
        message: message || "(no message)",
        source,
        status: "new",
        ip_address: ipAddress,
        user_agent: userAgent,
      })

    if (error) {
      console.error("[form-submit] DB insert failed:", error)
    }

    // Send email notification to tenant admin
    try {
      const adminEmail = await getAdminEmail(supabase, tenant.id, tenant.contact_email)
      if (adminEmail) {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
        await sendEmail({
          to: adminEmail,
          replyTo: email,
          subject: `New message from ${name} — ${tenant.name}`,
          html: buildNotificationEmail(tenant.name, name, email, phone, message, appUrl),
        })
      }
    } catch (err) {
      console.error("[form-submit] Email notification failed:", err)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[form-submit] Unexpected error:", err)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

async function getAdminEmail(
  supabase: ReturnType<typeof createClient>,
  tenantId: string,
  contactEmail?: string,
): Promise<string | null> {
  if (contactEmail) return contactEmail
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from("users")
    .select("email")
    .eq("tenant_id", tenantId)
    .eq("role", "admin")
    .limit(1)
    .maybeSingle()
  return (data as { email: string } | null)?.email ?? null
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function buildNotificationEmail(
  tenantName: string,
  name: string,
  email: string,
  phone: string | null,
  message: string,
  appUrl: string,
): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <div style="background: #1a1a2e; color: #fff; padding: 24px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 20px;">New message from your website</h1>
        <p style="margin: 8px 0 0; opacity: 0.8; font-size: 14px;">${escapeHtml(tenantName)}</p>
      </div>
      <div style="background: #fff; border: 1px solid #e5e7eb; border-top: 0; padding: 24px; border-radius: 0 0 8px 8px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr><td style="padding: 8px 0; color: #6b7280; width: 80px;">Name</td><td style="padding: 8px 0;"><strong>${escapeHtml(name)}</strong></td></tr>
          <tr><td style="padding: 8px 0; color: #6b7280;">Email</td><td style="padding: 8px 0;"><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></td></tr>
          ${phone ? `<tr><td style="padding: 8px 0; color: #6b7280;">Phone</td><td style="padding: 8px 0;"><a href="tel:${escapeHtml(phone)}">${escapeHtml(phone)}</a></td></tr>` : ""}
        </table>
        ${message ? `
        <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 8px;">Message</p>
          <p style="margin: 0; white-space: pre-wrap; line-height: 1.6;">${escapeHtml(message)}</p>
        </div>` : ""}
        <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af;">
          <a href="${appUrl}/admin/enquiries" style="color: #2B6BFF;">View in dashboard →</a>
        </div>
      </div>
    </div>
  `
}

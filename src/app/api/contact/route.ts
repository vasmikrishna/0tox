import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getSiteSettings, s } from "@/lib/site-settings"
import { sendEmail } from "@/lib/email"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, email, phone, service, message } = body

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Capture request context
    const userAgent = req.headers.get("user-agent") ?? null
    const ipAddress =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      null

    // 1. Save to DB
    const supabase = createClient()
    const { error } = await (supabase as any).from("contact_enquiries").insert({
      name,
      email,
      phone: phone || null,
      service: service || null,
      message,
      ip_address: ipAddress,
      user_agent: userAgent,
    })

    if (error) {
      console.error("[contact] DB insert failed:", error)
      // Don't fail the request — we still want to log/email the enquiry
    }

    // 2. Email forward
    try {
      const settings = await getSiteSettings()
      const to = process.env.ADMIN_EMAIL || s(settings, "contact_email") || "hello@0tox.com"

      const serviceLabel = {
        it: "IT Support & Infrastructure",
        web: "Web Services",
        ms365: "Microsoft 365",
        other: "Not sure / Other",
      }[service as string] ?? service ?? "Not specified"

      const html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <div style="background: ${s(settings, "theme_primary") || "#1B3A6B"}; color: #fff; padding: 24px; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 20px;">New enquiry from ${escapeHtml(name)}</h1>
            <p style="margin: 8px 0 0; opacity: 0.8; font-size: 14px;">Submitted via the contact form</p>
          </div>
          <div style="background: #fff; border: 1px solid #e5e7eb; border-top: 0; padding: 24px; border-radius: 0 0 8px 8px;">
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr><td style="padding: 8px 0; color: #6b7280; width: 100px;">Name</td><td style="padding: 8px 0;"><strong>${escapeHtml(name)}</strong></td></tr>
              <tr><td style="padding: 8px 0; color: #6b7280;">Email</td><td style="padding: 8px 0;"><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></td></tr>
              ${phone ? `<tr><td style="padding: 8px 0; color: #6b7280;">Phone</td><td style="padding: 8px 0;"><a href="tel:${escapeHtml(phone)}">${escapeHtml(phone)}</a></td></tr>` : ""}
              <tr><td style="padding: 8px 0; color: #6b7280;">Service</td><td style="padding: 8px 0;">${escapeHtml(serviceLabel)}</td></tr>
            </table>
            <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 8px;">Message</p>
              <p style="margin: 0; white-space: pre-wrap; line-height: 1.6;">${escapeHtml(message)}</p>
            </div>
            <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL ?? ""}/admin/enquiries" style="color: ${s(settings, "theme_accent") || "#16A34A"};">View in admin →</a>
            </div>
          </div>
        </div>
      `

      await sendEmail({
        to,
        replyTo: email,
        subject: `New enquiry: ${name}${service ? ` (${serviceLabel})` : ""}`,
        html,
      })
    } catch (err) {
      console.error("[contact] Email forward failed:", err)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[contact] error:", err)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

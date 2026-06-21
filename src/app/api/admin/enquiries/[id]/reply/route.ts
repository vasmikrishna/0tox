import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getSession } from "@/lib/session"
import { sendEmail } from "@/lib/email"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const tenantId = session.tenant_id

  try {
    const { id } = await params
    const { replyMessage } = await req.json()

    if (!replyMessage || !replyMessage.trim()) {
      return NextResponse.json({ error: "Reply message cannot be empty" }, { status: 400 })
    }

    const supabase = createClient()

    // Fetch the enquiry details
    const { data: enquiry, error: fetchError } = await (supabase as any)
      .from("contact_enquiries")
      .select("*")
      .eq("id", id)
      .eq("tenant_id", tenantId)
      .single()

    if (fetchError || !enquiry) {
      return NextResponse.json({ error: "Enquiry not found" }, { status: 404 })
    }

    // Send email using sendEmail helper
    const subject = enquiry.service
      ? `Re: Your enquiry about ${enquiry.service}`
      : "Re: Your enquiry"

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <p>Hi ${enquiry.name},</p>
        <div style="white-space: pre-wrap; font-size: 15px; line-height: 1.6; margin-bottom: 30px; color: #1f2937;">
          ${replyMessage.replace(/\n/g, '<br/>')}
        </div>
        <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #6b7280; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">Original Enquiry Message:</p>
        <blockquote style="margin: 0; padding-left: 16px; border-left: 4px solid #e5e7eb; color: #4b5563; font-style: italic; white-space: pre-wrap; font-size: 14px;">
          ${enquiry.message}
        </blockquote>
        <div style="margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 16px; font-size: 12px; color: #9ca3af;">
          — The 0toX Team
        </div>
      </div>
    `

    const sent = await sendEmail({
      to: enquiry.email,
      subject,
      html,
    })

    if (!sent) {
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 })
    }

    // Append to admin notes and mark status as replied
    const currentDate = new Date().toLocaleString("en-AU", {
      dateStyle: "short",
      timeStyle: "short",
    })
    const logPrefix = `[Reply sent on ${currentDate}]:\n${replyMessage}`
    const updatedAdminNote = enquiry.admin_note
      ? `${enquiry.admin_note}\n\n${logPrefix}`
      : logPrefix

    const { error: updateError } = await (supabase as any)
      .from("contact_enquiries")
      .update({
        status: "replied",
        admin_note: updatedAdminNote,
      })
      .eq("id", id)

    if (updateError) throw updateError

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[enquiries/reply] POST error:", err)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

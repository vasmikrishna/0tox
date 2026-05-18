import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, email, phone, service, message } = body

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // TODO: wire up email sending (e.g. Resend, SendGrid, or Nodemailer)
    // For now, log and return success so the form works end-to-end
    console.log("[Contact form submission]", { name, email, phone, service, message })

    // Optionally store in Supabase for follow-up
    try {
      const { createClient } = await import("@/lib/supabase/server")
      const supabase = createClient()
      await supabase.from("contact_enquiries").insert({
        name,
        email,
        phone: phone || null,
        service: service || null,
        message,
      } as any)
    } catch {
      // Table may not exist yet — that's fine, the form still "succeeds"
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { createClient } from "@/lib/supabase/server"
import { logChange } from "@/lib/audit"
import type { ServiceTier } from "@/types"
import { randomBytes } from "node:crypto"

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const tenantId = session.tenant_id

  const body = await request.json()
  const title = typeof body.title === "string" ? body.title.trim() : ""
  const serviceTier = body.service_tier as ServiceTier
  const answers = body.answers && typeof body.answers === "object"
    ? body.answers as Record<string, string>
    : {}

  if (!title || !serviceTier?.trim()) {
    return NextResponse.json({ error: "Project title and service tier are required" }, { status: 400 })
  }

  const supabase = createClient()
  let clientId: string
  let invitedClient: { email: string; tempPassword: string } | null = null

  if (session.role === "admin") {
    // Admin creates the project on behalf of a client (existing or invited)
    const existingClientId = typeof body.client_id === "string" ? body.client_id : ""
    const inviteEmail = typeof body.client_email === "string" ? body.client_email.trim().toLowerCase() : ""
    const inviteName = typeof body.client_name === "string" ? body.client_name.trim() : ""

    if (existingClientId) {
      const { data: existing } = await (supabase as any)
        .from("users")
        .select("id")
        .eq("id", existingClientId)
        .eq("tenant_id", tenantId)
        .single()
      if (!existing) {
        return NextResponse.json({ error: "Selected client not found" }, { status: 404 })
      }
      clientId = (existing as { id: string }).id
    } else if (inviteEmail && inviteName) {
      // Invite a brand-new client. If they already exist by email, link to that user.
      const { data: byEmail } = await (supabase as any)
        .from("users")
        .select("id")
        .eq("email", inviteEmail)
        .eq("tenant_id", tenantId)
        .maybeSingle()

      if (byEmail) {
        clientId = (byEmail as { id: string }).id
      } else {
        const bcrypt = await import("bcryptjs")
        const tempPassword = randomBytes(9).toString("base64url") // ~12 chars
        const password_hash = await bcrypt.hash(tempPassword, 12)
        const { data: created, error: createErr } = await (supabase as any)
          .from("users")
          .insert({
            email: inviteEmail,
            name: inviteName,
            password_hash,
            role: "client",
            tenant_id: tenantId,
          })
          .select("id")
          .single()
        if (createErr || !created) {
          return NextResponse.json({ error: createErr?.message ?? "Failed to create client" }, { status: 500 })
        }
        clientId = (created as { id: string }).id
        invitedClient = { email: inviteEmail, tempPassword }
      }
    } else {
      return NextResponse.json({ error: "Pick an existing client or provide email + name to invite" }, { status: 400 })
    }
  } else {
    // Client creates their own project
    const { data: user } = await supabase
      .from("users")
      .select("id")
      .eq("id", session.id)
      .eq("tenant_id", tenantId)
      .single()
    if (!user) {
      return NextResponse.json({ error: "Client profile not found" }, { status: 404 })
    }
    clientId = (user as { id: string }).id
  }

  const { data: project, error } = await (supabase as any)
    .from("projects")
    .insert({ client_id: clientId, title, service_tier: serviceTier, status: "intake", tenant_id: tenantId })
    .select()
    .single()

  if (error || !project) {
    return NextResponse.json({ error: error?.message ?? "Failed to create project" }, { status: 500 })
  }

  await logChange({
    projectId: project.id,
    userId: session.id,
    userEmail: session.email,
    action: "project.created",
    entityType: "project",
    entityId: project.id,
    changes: { title: { old: null, new: title }, service_tier: { old: null, new: serviceTier } },
  })

  const questionIds = Object.keys(answers).filter(id => !id.includes("-default-"))
  const responses = questionIds
    .filter(question_id => answers[question_id]?.trim())
    .map(question_id => ({
      project_id: project.id,
      question_id,
      answer: answers[question_id].trim(),
    }))

  if (responses.length) {
    const { error: responseError } = await (supabase as any).from("intake_responses").insert(responses)
    if (responseError) {
      return NextResponse.json({ error: responseError.message }, { status: 500 })
    }
  }

  // If we invited a new client, send them an email with login details
  if (invitedClient && process.env.RESEND_API_KEY) {
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ""
      const fromEmail = process.env.RESEND_FROM_EMAIL ?? "noreply@0tox.com"
      const html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #1B3A6B;">You've been added to a project at 0toX</h2>
          <p>Hi ${escapeHtml(body.client_name ?? "")},</p>
          <p>An admin has started a project for you on the 0toX client portal. You can log in to view progress, answer intake questions, and download deliverables.</p>
          <div style="background: #f8f9fa; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <p style="margin: 0 0 8px;"><strong>Email:</strong> ${escapeHtml(invitedClient.email)}</p>
            <p style="margin: 0;"><strong>Temporary password:</strong> <code style="background: #fff; padding: 2px 6px; border: 1px solid #e5e7eb; border-radius: 4px;">${escapeHtml(invitedClient.tempPassword)}</code></p>
          </div>
          <p>Please change your password after first login.</p>
          <p>
            <a href="${appUrl}/login" style="display: inline-block; background: #16A34A; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">Log in to the portal</a>
          </p>
          <p style="color: #6b7280; font-size: 12px; margin-top: 24px;">— The 0toX team</p>
        </div>
      `
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: `0toX <${fromEmail}>`,
          to: [invitedClient.email],
          subject: "Welcome to 0toX — your project has been started",
          html,
        }),
      })
    } catch (err) {
      console.error("[projects] invite email failed:", err)
    }
  }

  return NextResponse.json({
    project,
    invited: invitedClient ? { email: invitedClient.email, tempPassword: invitedClient.tempPassword } : null,
  })
}

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;")
}

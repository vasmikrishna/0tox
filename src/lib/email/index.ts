import { Resend } from "resend"
import { createClient } from "@/lib/supabase/server"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

export interface SendEmailOptions {
  to: string
  subject: string
  html: string
  replyTo?: string
}

export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  const provider = (process.env.EMAIL_PROVIDER || "").toLowerCase()
  const from = process.env.EMAIL_FROM || "noreply@0tox.com"
  const fromName = "0toX"

  if (provider === "zeptomail") {
    const rawToken = process.env.ZEPTOMAIL_API_KEY
    if (!rawToken) {
      console.error("❌ ZeptoMail API Key is missing (ZEPTOMAIL_API_KEY)")
      return false
    }

    const token = rawToken.replace(/["']/g, "").trim().replace(/^Zoho-enczapikey\s*/i, "").trim()
    const payload = {
      from: { address: from, name: fromName },
      to: [
        {
          email_address: {
            address: options.to,
            name: options.to.split("@")[0],
          },
        },
      ],
      subject: options.subject,
      htmlbody: options.html,
      ...(options.replyTo
        ? {
            reply_to: [
              {
                address: options.replyTo,
                name: options.replyTo.split("@")[0],
              },
            ],
          }
        : {}),
    }

    try {
      const response = await fetch("https://api.zeptomail.in/v1.1/email", {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          "Authorization": `Zoho-enczapikey ${token}`,
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error("❌ ZeptoMail API Error:", JSON.stringify(data, null, 2))
        return false
      }

      if (data.message === "OK" || (data.data && data.data[0]?.code === "EM_104")) {
        console.log(`✅ Email sent via ZeptoMail to ${options.to}`)
        return true
      } else {
        console.error("❌ ZeptoMail returned unexpected response:", JSON.stringify(data, null, 2))
        return false
      }
    } catch (error) {
      console.error("❌ Error sending email via ZeptoMail:", error)
      return false
    }
  }

  // Fallback: Resend
  if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== "your_resend_api_key") {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from: `"${fromName}" <${from}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        ...(options.replyTo ? { reply_to: options.replyTo } : {}),
      })
      console.log(`✅ Email sent via Resend to ${options.to}`)
      return true
    } catch (error) {
      console.error("❌ Error sending email via Resend:", error)
      return false
    }
  }

  console.log("📧 Email simulation (not sent - no valid provider/credentials configured):")
  console.log("To:", options.to)
  console.log("Subject:", options.subject)
  return false
}

export async function sendProjectSubmittedEmail(to: string, clientName: string, projectTitle: string, projectId: string) {
  await sendEmail({
    to,
    subject: `We received your project: ${projectTitle}`,
    html: `
      <p>Hi ${clientName},</p>
      <p>Thanks for submitting <strong>${projectTitle}</strong>. We've received your requirements and will review them within 24 hours.</p>
      <p>You can track your project here: <a href="${APP_URL}/client/projects/${projectId}">View project</a></p>
      <p>— The 0toX team</p>
    `,
  })
}

export async function sendStageCompletedEmail(to: string, clientName: string, projectTitle: string, stageName: string, projectId: string) {
  await sendEmail({
    to,
    subject: `✅ Stage complete: ${stageName} — ${projectTitle}`,
    html: `
      <p>Hi ${clientName},</p>
      <p>We've completed the <strong>${stageName}</strong> stage for <strong>${projectTitle}</strong>.</p>
      <p>Log in to view your project and download any deliverables: <a href="${APP_URL}/client/projects/${projectId}">View project</a></p>
      <p>— The 0toX team</p>
    `,
  })
}

export async function sendPaymentDueEmail(to: string, clientName: string, projectTitle: string, paymentLabel: string, amount: number, projectId: string) {
  await sendEmail({
    to,
    subject: `Payment due: ${paymentLabel} — ${projectTitle}`,
    html: `
      <p>Hi ${clientName},</p>
      <p>A payment is due for <strong>${projectTitle}</strong>:</p>
      <p><strong>${paymentLabel} — $${amount.toFixed(2)}</strong></p>
      <p>Pay now: <a href="${APP_URL}/client/projects/${projectId}">View project & pay</a></p>
      <p>— The 0toX team</p>
    `,
  })
}

export async function sendPaymentReceivedEmail(to: string, clientName: string, projectTitle: string, paymentLabel: string, amount: number) {
  await sendEmail({
    to,
    subject: `Payment received: ${paymentLabel} — ${projectTitle}`,
    html: `
      <p>Hi ${clientName},</p>
      <p>We've received your payment for <strong>${projectTitle}</strong>:</p>
      <p><strong>${paymentLabel} — $${amount.toFixed(2)}</strong></p>
      <p>Thank you!</p>
      <p>— The 0toX team</p>
    `,
  })
}

export async function sendNewSubmissionAdminEmail(projectTitle: string, clientName: string, tier: string, projectId: string) {
  const adminEmail = process.env.ADMIN_EMAIL
  if (!adminEmail) return
  await sendEmail({
    to: adminEmail,
    subject: `New project submission: ${projectTitle} (${tier})`,
    html: `
      <p>New project submitted by <strong>${clientName}</strong>:</p>
      <p><strong>${projectTitle}</strong> — ${tier} tier</p>
      <p><a href="${APP_URL}/admin/projects/${projectId}">Review in admin</a></p>
    `,
  })
}

export async function notifyProjectStatusChange(projectId: string, oldStatus: string, newStatus: string) {
  try {
    const supabase = createClient()
    
    // 1. Fetch project details
    const { data: project, error: projectError } = await (supabase as any)
      .from("projects")
      .select("title, client_id")
      .eq("id", projectId)
      .single()

    if (projectError || !project) {
      console.error("❌ [notifyProjectStatusChange] Project not found:", projectError)
      return
    }

    const projectTitle = project.title
    const clientId = project.client_id

    // 2. Fetch client details
    const { data: client, error: clientError } = await (supabase as any)
      .from("users")
      .select("name, email")
      .eq("id", clientId)
      .single()

    if (clientError || !client) {
      console.error("❌ [notifyProjectStatusChange] Client not found:", clientError)
    }

    // 3. Fetch assigned employees
    const { data: assignments, error: assignmentsError } = await (supabase as any)
      .from("project_assignments")
      .select("employee_id, users!project_assignments_employee_id_fkey(name, email)")
      .eq("project_id", projectId)

    if (assignmentsError) {
      console.error("❌ [notifyProjectStatusChange] Failed to fetch assignments:", assignmentsError)
    }

    const employees = (assignments ?? [])
      .map((a: any) => a.users)
      .filter(Boolean) as { name: string; email: string }[]

    // 4. Send email to client
    if (client?.email) {
      const clientHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 8px;">
          <h2 style="color: #1B3A6B; margin-top: 0;">Project Status Update</h2>
          <p>Hi ${client.name || "Client"},</p>
          <p>The status of your project <strong>${projectTitle}</strong> has been updated:</p>
          <div style="background: #f3f4f6; padding: 16px; border-radius: 6px; margin: 20px 0; font-size: 16px; border-left: 4px solid #16A34A;">
            Status: <span style="text-transform: capitalize; font-weight: bold; color: #16A34A;">${newStatus}</span> 
            <span style="color: #6b7280; font-size: 14px;">(was ${oldStatus})</span>
          </div>
          <p>You can track the progress of your project on your dashboard:</p>
          <p><a href="${APP_URL}/client/projects/${projectId}" style="display: inline-block; background: #1B3A6B; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 14px;">View Project</a></p>
          <p>— The 0toX Team</p>
        </div>
      `
      await sendEmail({
        to: client.email,
        subject: `Update on your project: ${projectTitle} is now ${newStatus.toUpperCase()}`,
        html: clientHtml,
      })
    }

    // 5. Send emails to assigned employees
    for (const employee of employees) {
      if (employee.email) {
        const employeeHtml = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 8px;">
            <h2 style="color: #1B3A6B; margin-top: 0;">Project Status Update</h2>
            <p>Hi ${employee.name || "Team Member"},</p>
            <p>A project you are assigned to, <strong>${projectTitle}</strong>, has a new status update:</p>
            <div style="background: #f3f4f6; padding: 16px; border-radius: 6px; margin: 20px 0; font-size: 16px; border-left: 4px solid #16A34A;">
              New Status: <span style="text-transform: capitalize; font-weight: bold; color: #16A34A;">${newStatus}</span> 
              <span style="color: #6b7280; font-size: 14px;">(was ${oldStatus})</span>
            </div>
            <p>Please log in to the portal to review any updates:</p>
            <p><a href="${APP_URL}/employee/projects/${projectId}" style="display: inline-block; background: #1B3A6B; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 14px;">View Project</a></p>
            <p>— 0toX System</p>
          </div>
        `
        await sendEmail({
          to: employee.email,
          subject: `[Status: ${newStatus.toUpperCase()}] Project: ${projectTitle}`,
          html: employeeHtml,
        })
      }
    }
  } catch (error) {
    console.error("❌ Error in notifyProjectStatusChange:", error)
  }
}

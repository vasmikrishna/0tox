import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.EMAIL_FROM ?? "noreply@nexoit.com.au"
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

export async function sendProjectSubmittedEmail(to: string, clientName: string, projectTitle: string, projectId: string) {
  await resend.emails.send({
    from: FROM,
    to,
    subject: `We received your project: ${projectTitle}`,
    html: `
      <p>Hi ${clientName},</p>
      <p>Thanks for submitting <strong>${projectTitle}</strong>. We've received your requirements and will review them within 24 hours.</p>
      <p>You can track your project here: <a href="${APP_URL}/client/projects/${projectId}">View project</a></p>
      <p>— The NexoIT team</p>
    `,
  })
}

export async function sendStageCompletedEmail(to: string, clientName: string, projectTitle: string, stageName: string, projectId: string) {
  await resend.emails.send({
    from: FROM,
    to,
    subject: `✅ Stage complete: ${stageName} — ${projectTitle}`,
    html: `
      <p>Hi ${clientName},</p>
      <p>We've completed the <strong>${stageName}</strong> stage for <strong>${projectTitle}</strong>.</p>
      <p>Log in to view your project and download any deliverables: <a href="${APP_URL}/client/projects/${projectId}">View project</a></p>
      <p>— The NexoIT team</p>
    `,
  })
}

export async function sendPaymentDueEmail(to: string, clientName: string, projectTitle: string, paymentLabel: string, amount: number, projectId: string) {
  await resend.emails.send({
    from: FROM,
    to,
    subject: `Payment due: ${paymentLabel} — ${projectTitle}`,
    html: `
      <p>Hi ${clientName},</p>
      <p>A payment is due for <strong>${projectTitle}</strong>:</p>
      <p><strong>${paymentLabel} — $${amount.toFixed(2)}</strong></p>
      <p>Pay now: <a href="${APP_URL}/client/projects/${projectId}">View project & pay</a></p>
      <p>— The NexoIT team</p>
    `,
  })
}

export async function sendPaymentReceivedEmail(to: string, clientName: string, projectTitle: string, paymentLabel: string, amount: number) {
  await resend.emails.send({
    from: FROM,
    to,
    subject: `Payment received: ${paymentLabel} — ${projectTitle}`,
    html: `
      <p>Hi ${clientName},</p>
      <p>We've received your payment for <strong>${projectTitle}</strong>:</p>
      <p><strong>${paymentLabel} — $${amount.toFixed(2)}</strong></p>
      <p>Thank you!</p>
      <p>— The NexoIT team</p>
    `,
  })
}

export async function sendNewSubmissionAdminEmail(projectTitle: string, clientName: string, tier: string, projectId: string) {
  const adminEmail = process.env.ADMIN_EMAIL
  if (!adminEmail) return
  await resend.emails.send({
    from: FROM,
    to: adminEmail,
    subject: `New project submission: ${projectTitle} (${tier})`,
    html: `
      <p>New project submitted by <strong>${clientName}</strong>:</p>
      <p><strong>${projectTitle}</strong> — ${tier} tier</p>
      <p><a href="${APP_URL}/admin/projects/${projectId}">Review in admin</a></p>
    `,
  })
}

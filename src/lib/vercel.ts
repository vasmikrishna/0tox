/**
 * Vercel Domains API client.
 *
 * Custom domains entered by tenants must be registered on the Vercel project
 * so the edge knows to route that hostname to our deployment. Without this,
 * DNS can resolve correctly yet Vercel still returns 404 DEPLOYMENT_NOT_FOUND
 * because no project owns the host.
 *
 * When the token is absent (local dev), `isVercelConfigured()` returns false
 * and callers fall back to a plain DNS check so the flow stays demoable.
 */

const API = "https://api.vercel.com"

export function isVercelConfigured(): boolean {
  return !!process.env.VERCEL_TOKEN?.trim() && !!process.env.VERCEL_PROJECT_ID?.trim()
}

function teamQuery(): string {
  const teamId = process.env.VERCEL_TEAM_ID?.trim()
  return teamId ? `?teamId=${encodeURIComponent(teamId)}` : ""
}

async function vercelFetch(path: string, init?: RequestInit) {
  const token = process.env.VERCEL_TOKEN?.trim()
  if (!token) throw new Error("Vercel is not configured")
  return fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  })
}

/**
 * Register a domain on the project. Idempotent: a domain that already exists
 * on this project (409 "domain_already_in_use" by the same project) is treated
 * as success. Returns an error string if the domain is held by another project.
 */
export async function addDomainToProject(domain: string): Promise<{ ok: boolean; error?: string }> {
  const projectId = process.env.VERCEL_PROJECT_ID!.trim()
  const res = await vercelFetch(`/v10/projects/${projectId}/domains${teamQuery()}`, {
    method: "POST",
    body: JSON.stringify({ name: domain }),
  })
  if (res.ok) return { ok: true }

  const body = await res.json().catch(() => ({}))
  const code = body?.error?.code as string | undefined
  // Already attached to THIS project → fine.
  if (res.status === 409 && code === "domain_already_in_use_by_this_project") {
    return { ok: true }
  }
  if (code === "domain_already_in_use") {
    return { ok: false, error: "This domain is already connected to another Vercel project." }
  }
  return { ok: false, error: body?.error?.message ?? "Failed to register domain with Vercel" }
}

/** Remove a domain from the project. A 404 (already gone) counts as success. */
export async function removeDomainFromProject(domain: string): Promise<void> {
  const projectId = process.env.VERCEL_PROJECT_ID!.trim()
  await vercelFetch(`/v9/projects/${projectId}/domains/${encodeURIComponent(domain)}${teamQuery()}`, {
    method: "DELETE",
  }).catch(() => {})
}

export interface DomainChallenge {
  type: string
  domain: string
  value: string
}

export interface DomainStatus {
  /** True only when ownership is verified AND DNS routes to us. Site is live. */
  verified: boolean
  /** DNS points at Vercel and the cert can be issued. */
  dnsOk: boolean
  /** Ownership confirmed (no pending TXT challenge). */
  ownershipOk: boolean
  /** Extra records the user must add to prove ownership (TXT challenges). */
  challenges: DomainChallenge[]
}

/**
 * Full readiness of a custom domain. A domain is only live when BOTH:
 *  - ownership is verified (project-domain `verified: true`, no pending TXT), and
 *  - DNS is configured (`misconfigured: false`).
 * When the apex is registered on another Vercel account, Vercel requires a TXT
 * challenge at `_vercel.<apex>` — returned here as `challenges` so the UI can
 * tell the user exactly what to add.
 */
export async function getDomainStatus(domain: string): Promise<DomainStatus> {
  const projectId = process.env.VERCEL_PROJECT_ID!.trim()

  const [projRes, cfgRes] = await Promise.all([
    vercelFetch(`/v9/projects/${projectId}/domains/${encodeURIComponent(domain)}${teamQuery()}`),
    vercelFetch(`/v6/domains/${encodeURIComponent(domain)}/config${teamQuery()}`),
  ])

  const proj = projRes.ok ? await projRes.json().catch(() => ({})) : {}
  const cfg = cfgRes.ok ? await cfgRes.json().catch(() => ({})) : {}

  const ownershipOk = proj?.verified === true
  const dnsOk = cfg?.misconfigured === false
  const challenges: DomainChallenge[] = Array.isArray(proj?.verification)
    ? proj.verification.map((v: DomainChallenge) => ({ type: v.type, domain: v.domain, value: v.value }))
    : []

  return { verified: ownershipOk && dnsOk, dnsOk, ownershipOk, challenges }
}

/** Trigger Vercel's ownership re-check (after the user adds the TXT record). */
export async function verifyProjectDomain(domain: string): Promise<void> {
  const projectId = process.env.VERCEL_PROJECT_ID!.trim()
  await vercelFetch(`/v9/projects/${projectId}/domains/${encodeURIComponent(domain)}/verify${teamQuery()}`, {
    method: "POST",
  }).catch(() => {})
}

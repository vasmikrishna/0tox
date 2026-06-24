import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import { getWorkspacesForEmail } from "@/lib/workspaces"
import { AccountHub } from "@/components/account/account-hub"

export const metadata: Metadata = { title: "My businesses" }

// Cross-tenant hub. Lives outside the (client)/(admin) groups so it is NOT subject
// to subdomain tenant-isolation — a person can see every business they belong to
// regardless of which subdomain they're currently on (the session cookie is shared
// across *.site9.in).
export const dynamic = "force-dynamic"

export default async function AccountPage() {
  const session = await getSession()
  // Super-admin uses /superadmin; everyone else needs a real per-tenant identity.
  if (!session || session.id === "admin") redirect("/login")

  const workspaces = await getWorkspacesForEmail(session.email, session.tenant_id)

  return (
    <AccountHub
      userName={session.name}
      userEmail={session.email}
      workspaces={workspaces}
      baseDomain={process.env.NEXT_PUBLIC_BASE_DOMAIN ?? "site9.in"}
    />
  )
}

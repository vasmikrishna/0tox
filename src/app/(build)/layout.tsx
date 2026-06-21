import { redirect } from "next/navigation"
import { getOwnerContext } from "@/lib/build-owner"

/**
 * The website builder is for self-serve owners who haven't finished onboarding.
 * Once their site is published (onboarding_complete), the portal takes over and
 * /build sends them there instead.
 */
export default async function BuildLayout({ children }: { children: React.ReactNode }) {
  const owner = await getOwnerContext()
  if (!owner) redirect("/login")
  if (owner.tenant.onboarding_complete) redirect("/client/dashboard")

  return <div className="min-h-screen bg-background">{children}</div>
}

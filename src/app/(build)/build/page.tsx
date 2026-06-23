import { getOwnerContext } from "@/lib/build-owner"
import { subdomainHost, type BusinessDetails } from "@/lib/onboarding"
import { BuildPageClient } from "./build-client"

export default async function BuildPage() {
  const owner = await getOwnerContext()
  if (!owner) return null

  const saved = ((owner.tenant.settings as any)?.business ?? {}) as BusinessDetails
  const initial: BusinessDetails = { ...saved, name: saved.name || owner.tenant.name }
  const onboardingComplete = !!(owner.tenant as any).onboarding_complete

  return (
    <BuildPageClient
      initialDetails={initial}
      ownerName={owner.session.name}
      host={subdomainHost(owner.tenant.slug)}
      onboardingComplete={onboardingComplete}
    />
  )
}

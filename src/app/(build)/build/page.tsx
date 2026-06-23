import { getOwnerContext } from "@/lib/build-owner"
import { subdomainHost, type BusinessDetails } from "@/lib/onboarding"
import { getSubscriptionStatus } from "@/lib/subscription"
import { BuildPageClient } from "./build-client"

export default async function BuildPage({ searchParams }: { searchParams: Promise<{ template?: string }> }) {
  const owner = await getOwnerContext()
  if (!owner) return null

  const sp = await searchParams
  const saved = ((owner.tenant.settings as any)?.business ?? {}) as BusinessDetails
  const initial: BusinessDetails = { ...saved, name: saved.name || owner.tenant.name }
  const onboardingComplete = !!(owner.tenant as any).onboarding_complete
  const subscription = await getSubscriptionStatus(owner.tenant.id)

  return (
    <BuildPageClient
      initialDetails={initial}
      ownerName={owner.session.name}
      host={subdomainHost(owner.tenant.slug)}
      onboardingComplete={onboardingComplete}
      templateSlug={sp.template}
      subscribed={subscription.active}
    />
  )
}

import { getOwnerContext } from "@/lib/build-owner"
import { subdomainHost, type BusinessDetails } from "@/lib/onboarding"
import { Builder } from "@/components/build/builder"

export default async function BuildPage() {
  const owner = await getOwnerContext()
  // Layout already guarantees an owner; this is just for types.
  if (!owner) return null

  const saved = ((owner.tenant.settings as any)?.business ?? {}) as BusinessDetails
  const initial: BusinessDetails = { ...saved, name: saved.name || owner.tenant.name }

  return (
    <Builder
      initialDetails={initial}
      ownerName={owner.session.name}
      host={subdomainHost(owner.tenant.slug)}
    />
  )
}

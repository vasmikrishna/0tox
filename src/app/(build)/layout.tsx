import { redirect } from "next/navigation"
import { getOwnerContext } from "@/lib/build-owner"

export default async function BuildLayout({ children }: { children: React.ReactNode }) {
  const owner = await getOwnerContext()
  if (!owner) redirect("/login")

  return <>{children}</>
}

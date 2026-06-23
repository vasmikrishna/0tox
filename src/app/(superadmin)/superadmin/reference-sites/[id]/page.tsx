import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { ReferenceSiteForm } from "../reference-site-form"
import type { ReferenceSite } from "@/types"

export default async function EditReferenceSitePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createClient()
  const { data } = await (supabase as any)
    .from("reference_sites")
    .select("*")
    .eq("id", id)
    .single()

  if (!data) notFound()

  return <ReferenceSiteForm initial={data as ReferenceSite} />
}

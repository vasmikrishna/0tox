import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { SectionForm } from "../section-form"
import type { SectionTemplate } from "@/types"

export default async function EditSectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createClient()
  const { data } = await (supabase as any)
    .from("section_templates")
    .select("*")
    .eq("id", id)
    .single()

  if (!data) notFound()

  return <SectionForm initial={data as SectionTemplate} />
}

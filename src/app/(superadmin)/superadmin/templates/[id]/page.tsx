import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { TemplateForm } from "../template-form"
import type { GalleryTemplate } from "@/types"

export default async function EditTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createClient()
  const { data } = await (supabase as any)
    .from("page_templates_gallery")
    .select("*")
    .eq("id", id)
    .single()

  if (!data) notFound()

  return <TemplateForm initial={data as GalleryTemplate} />
}

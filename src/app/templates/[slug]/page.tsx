import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import type { GalleryTemplate } from "@/types"
import type { Metadata } from "next"
import { TemplatePreviewClient } from "./preview-client"

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = createClient()
  const { data } = await (supabase as any)
    .from("page_templates_gallery")
    .select("name,description")
    .eq("slug", slug)
    .eq("status", "approved")
    .single()

  if (!data) return { title: "Template Not Found" }
  return {
    title: `${data.name} — Site9 Templates`,
    description: data.description,
  }
}

export default async function TemplatePreviewPage({ params }: Props) {
  const { slug } = await params
  const supabase = createClient()
  const { data } = await (supabase as any)
    .from("page_templates_gallery")
    .select("*")
    .eq("slug", slug)
    .eq("status", "approved")
    .single()

  if (!data) notFound()

  return <TemplatePreviewClient template={data as GalleryTemplate} />
}

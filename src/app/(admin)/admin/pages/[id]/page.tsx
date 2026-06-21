import { notFound } from "next/navigation"
import type { CustomPage } from "@/types"
import { MOCK_CUSTOM_PAGES } from "@/lib/mock-data"
import { PageEditor } from "./page-editor"

const supabaseConfigured = () =>
  process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith("http") &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

async function getPage(id: string): Promise<CustomPage | null> {
  if (!supabaseConfigured()) {
    return MOCK_CUSTOM_PAGES.find((p) => p.id === id) ?? null
  }
  try {
    const { createClient } = await import("@/lib/supabase/server")
    const { getCurrentTenant } = await import("@/lib/tenant")
    const supabase = createClient()
    const tenant = await getCurrentTenant().catch(() => null)
    let query = supabase.from("custom_pages").select("*").eq("id", id)
    if (tenant?.id) query = query.eq("tenant_id", tenant.id)
    const { data } = await query.maybeSingle()
    return (data as CustomPage | null) ?? null
  } catch {
    return null
  }
}

export default async function AdminPageEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const page = await getPage(id)

  if (!page) notFound()

  return <PageEditor page={page} demoMode={!supabaseConfigured()} />
}

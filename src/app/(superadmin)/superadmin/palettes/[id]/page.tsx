import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { PaletteForm } from "../palette-form"
import type { ColorPalette } from "@/types"

export default async function EditPalettePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createClient()
  const { data } = await (supabase as any)
    .from("color_palettes")
    .select("*")
    .eq("id", id)
    .single()

  if (!data) notFound()

  return <PaletteForm initial={data as ColorPalette} />
}

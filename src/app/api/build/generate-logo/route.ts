import { NextResponse } from "next/server"
import { getOwnerContext } from "@/lib/build-owner"
import { generateLogoOptions, isLogoAiConfigured } from "@/lib/logo-generate"

export const runtime = "nodejs"
export const maxDuration = 120

export async function POST(req: Request) {
  try {
    const owner = await getOwnerContext()
    if (!owner) return NextResponse.json({ error: "Not signed in" }, { status: 401 })

    if (!isLogoAiConfigured()) {
      return NextResponse.json({ error: "AI not configured" }, { status: 503 })
    }

    const body = await req.json().catch(() => ({}))
    const options = await generateLogoOptions({
      tenantId: owner.tenant.id,
      businessName: String(body.businessName ?? owner.tenant.name),
      category: typeof body.category === "string" ? body.category : undefined,
      colors: body.colors,
      style: typeof body.style === "string" ? body.style : undefined,
      count: body.count,
    })

    return NextResponse.json({ options })
  } catch (err: unknown) {
    console.error("[build/generate-logo]", err)
    return NextResponse.json(
      { error: `Logo generation failed: ${(err as Error)?.message ?? "unknown"}` },
      { status: 502 }
    )
  }
}

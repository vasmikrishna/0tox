import { NextResponse } from "next/server"
import { getOwnerContext } from "@/lib/build-owner"
import { addBrandAsset, listBrandAssets, removeBrandAsset } from "@/lib/build-assets"

export const runtime = "nodejs"

/**
 * Per-tenant brand asset library ("the owner's drive").
 *
 * GET    /api/build/assets        → { assets }
 * POST   /api/build/assets        → save a logo  { url, style? } → { asset, assets }
 * DELETE /api/build/assets        → remove        { id }          → { assets }
 */
export async function GET() {
  const owner = await getOwnerContext()
  if (!owner) return NextResponse.json({ error: "Not signed in" }, { status: 401 })
  return NextResponse.json({ assets: listBrandAssets(owner.tenant) })
}

export async function POST(req: Request) {
  const owner = await getOwnerContext()
  if (!owner) return NextResponse.json({ error: "Not signed in" }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const url = typeof body.url === "string" ? body.url.trim() : ""
  if (!url) return NextResponse.json({ error: "url is required" }, { status: 400 })

  try {
    const { asset, assets } = await addBrandAsset(owner.tenant, {
      url,
      kind: "logo",
      style: typeof body.style === "string" ? body.style : undefined,
      createdAt: new Date().toISOString(),
    })
    return NextResponse.json({ asset, assets })
  } catch (err) {
    console.error("[build/assets POST]", err)
    return NextResponse.json({ error: "Could not save asset" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const owner = await getOwnerContext()
  if (!owner) return NextResponse.json({ error: "Not signed in" }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const id = typeof body.id === "string" ? body.id : ""
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 })

  try {
    const assets = await removeBrandAsset(owner.tenant, id)
    return NextResponse.json({ assets })
  } catch (err) {
    console.error("[build/assets DELETE]", err)
    return NextResponse.json({ error: "Could not delete asset" }, { status: 500 })
  }
}

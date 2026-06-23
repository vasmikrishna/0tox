import { NextResponse } from "next/server"
import { getOwnerContext } from "@/lib/build-owner"
import { uploadBufferToR2, isR2Configured } from "@/lib/r2"

export const runtime = "nodejs"

export async function POST(req: Request) {
  const owner = await getOwnerContext()
  if (!owner) return NextResponse.json({ error: "Not signed in" }, { status: 401 })

  if (!isR2Configured()) {
    return NextResponse.json({ error: "Image storage not configured." }, { status: 503 })
  }

  const body = await req.json().catch(() => null)
  const imageUrl = body?.url as string | undefined
  if (!imageUrl) return NextResponse.json({ error: "URL required" }, { status: 400 })

  try {
    const res = await fetch(imageUrl, { signal: AbortSignal.timeout(15_000) })
    if (!res.ok) return NextResponse.json({ error: "Failed to fetch image" }, { status: 502 })

    const contentType = res.headers.get("content-type") ?? "image/jpeg"
    const buffer = Buffer.from(await res.arrayBuffer())

    if (buffer.length > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Image too large (max 10 MB)" }, { status: 400 })
    }

    const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg"
    const key = `builder/${owner.tenant.id}/${Date.now()}-${crypto.randomUUID()}.${ext}`
    const appUrl = await uploadBufferToR2(buffer, key, contentType)

    const base = process.env.NEXT_PUBLIC_APP_URL || `${req.headers.get("x-forwarded-proto") || "http"}://${req.headers.get("host")}`
    return NextResponse.json({ url: `${base}${appUrl}` })
  } catch {
    return NextResponse.json({ error: "Could not download image." }, { status: 500 })
  }
}

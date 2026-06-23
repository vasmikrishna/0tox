import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { getR2Object } from "@/lib/r2"

export async function GET(_request: Request, { params }: { params: Promise<{ key: string[] }> }) {
  const { key } = await params
  const objectKey = key.map(decodeURIComponent).join("/")

  // Builder-uploaded images are public (they appear on published websites
  // and inside the sandboxed editor iframe which has no session cookie).
  const isPublic = objectKey.startsWith("builder/")
  if (!isPublic) {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  try {
    const object = await getR2Object(objectKey)
    const headers = new Headers()

    if (object.ContentType) headers.set("content-type", object.ContentType)
    if (object.ContentLength) headers.set("content-length", String(object.ContentLength))
    headers.set("cache-control", isPublic ? "public, max-age=31536000" : "private, max-age=300")

    return new Response(object.Body?.transformToWebStream(), { headers })
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 })
  }
}

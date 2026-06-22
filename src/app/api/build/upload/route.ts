import { NextResponse } from "next/server"
import { getOwnerContext } from "@/lib/build-owner"
import { uploadToR2, isR2Configured } from "@/lib/r2"

export const runtime = "nodejs"

const MAX_SIZE = 5 * 1024 * 1024 // 5 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"]

/**
 * POST /api/build/upload
 * Upload an image for the website builder. Stores in R2 under builder/{tenantId}/.
 *
 * Body: FormData with a "file" field.
 * Returns: { url: string }
 */
export async function POST(req: Request) {
  const owner = await getOwnerContext()
  if (!owner) return NextResponse.json({ error: "Not signed in" }, { status: 401 })

  if (!isR2Configured()) {
    return NextResponse.json({ error: "Image storage not configured." }, { status: 503 })
  }

  const formData = await req.formData().catch(() => null)
  const file = formData?.get("file")
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 })
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Only JPEG, PNG, WebP, GIF, and SVG images are allowed." }, { status: 400 })
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Image must be under 5 MB." }, { status: 400 })
  }

  try {
    const result = await uploadToR2(file, `builder/${owner.tenant.id}`)
    return NextResponse.json({ url: result.url })
  } catch {
    return NextResponse.json({ error: "Could not upload image." }, { status: 500 })
  }
}

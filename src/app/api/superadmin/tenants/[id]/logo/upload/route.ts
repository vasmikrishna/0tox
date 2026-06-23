import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { uploadToR2, isR2Configured } from "@/lib/r2"

export const runtime = "nodejs"

const SUPER_ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@0tox.com"
const MAX_SIZE = 5 * 1024 * 1024 // 5 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"]

async function assertSuperAdmin() {
  const session = await getSession()
  if (!session || session.email !== SUPER_ADMIN_EMAIL) return null
  return session
}

/**
 * POST /api/superadmin/tenants/[id]/logo/upload
 * Upload a logo image for an arbitrary tenant (superadmin). Stores in R2 under
 * builder/{tenantId}/. Body: FormData with a "file" field. Returns { url }.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!await assertSuperAdmin()) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  if (!isR2Configured()) return NextResponse.json({ error: "Image storage not configured." }, { status: 503 })

  const { id } = await params
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
    const result = await uploadToR2(file, `builder/${id}`)
    const base = process.env.NEXT_PUBLIC_APP_URL || `${req.headers.get("x-forwarded-proto") || "http"}://${req.headers.get("host")}`
    // uploadToR2 returns an absolute URL when a public R2 domain is configured,
    // otherwise an app-relative path — only prepend the origin in the latter case.
    const url = result.url.startsWith("http") ? result.url : `${base}${result.url}`
    return NextResponse.json({ url })
  } catch {
    return NextResponse.json({ error: "Could not upload image." }, { status: 500 })
  }
}

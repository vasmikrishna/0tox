import { NextResponse } from "next/server"

// Dev-only endpoint — sets a cookie to override the active tenant slug on localhost
export async function POST(req: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 })
  }
  const { slug } = await req.json()
  if (!slug) return NextResponse.json({ error: "slug required" }, { status: 400 })

  const res = NextResponse.json({ ok: true })
  res.cookies.set("dev_tenant", slug, {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
  })
  return res
}

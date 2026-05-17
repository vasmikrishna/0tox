import { NextResponse, type NextRequest } from "next/server"
import { jwtVerify } from "jose"

const SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET ?? "fallback-dev-secret-change-in-production"
)

async function getSessionFromRequest(req: NextRequest) {
  try {
    const token = req.cookies.get("session")?.value
    if (!token) return null
    const { payload } = await jwtVerify(token, SECRET)
    return payload as any
  } catch {
    return null
  }
}

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname
  const session = await getSessionFromRequest(req)

  if (!session && (path.startsWith("/client") || path.startsWith("/admin"))) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  if (session && (path === "/login" || path === "/register")) {
    return NextResponse.redirect(new URL(
      session.role === "admin" ? "/admin/dashboard" : "/client/dashboard",
      req.url
    ))
  }

  if (session && path.startsWith("/admin") && session.role !== "admin") {
    return NextResponse.redirect(new URL("/client/dashboard", req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/client/:path*", "/admin/:path*", "/login", "/register"],
}

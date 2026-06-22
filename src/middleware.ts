import { NextResponse, type NextRequest } from "next/server"
import { jwtVerify } from "jose"
import { FEATURES } from "@/lib/features"

const SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET ?? "fallback-dev-secret-change-in-production"
)
const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN ?? "0tox.com"

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

function dashboardFor(role: string) {
  if (role === "admin") return "/admin/dashboard"
  if (role === "employee") return "/employee/dashboard"
  return "/client/dashboard"
}

function extractTenantSlug(req: NextRequest): string {
  const host = req.headers.get("host") ?? "localhost"
  const cleanHost = host.split(":")[0]

  // Production: nexoit.0tox.com → "nexoit"
  if (cleanHost.endsWith(`.${BASE_DOMAIN}`)) {
    return cleanHost.slice(0, cleanHost.length - BASE_DOMAIN.length - 1)
  }

  // Local subdomain testing: nexoit.localhost → "nexoit"
  // Works natively in Chrome/Firefox without /etc/hosts changes
  if (cleanHost.endsWith(".localhost") && cleanHost !== "localhost") {
    return cleanHost.slice(0, cleanHost.lastIndexOf(".localhost"))
  }

  // Dev cookie set by the login page tenant-switcher
  const devTenant = req.cookies.get("dev_tenant")?.value
  if (devTenant) return devTenant

  // Final fallback: TENANT_SLUG env or default
  return process.env.TENANT_SLUG ?? "0tox"
}

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname
  const session = await getSessionFromRequest(req)
  const tenantSlug = extractTenantSlug(req)

  // Build response with tenant slug header so server components & API routes can read it
  const res = NextResponse.next({
    request: {
      headers: new Headers({
        ...Object.fromEntries(req.headers.entries()),
        "x-tenant-slug": tenantSlug,
      }),
    },
  })
  res.headers.set("x-tenant-slug", tenantSlug)

  // Hidden features: block their routes (code/data stay in place — see lib/features.ts)
  if (!FEATURES.ecommerce && (path.startsWith("/admin/products") || path.startsWith("/admin/orders") || path.startsWith("/shop"))) {
    return NextResponse.redirect(new URL(path.startsWith("/admin") ? "/admin/dashboard" : "/", req.url))
  }
  if (!FEATURES.pageBuilder && (path.startsWith("/admin/pages") || path.startsWith("/p/"))) {
    return NextResponse.redirect(new URL(path.startsWith("/admin") ? "/admin/dashboard" : "/", req.url))
  }
  if (!FEATURES.bookings && (path.startsWith("/admin/bookings") || path.startsWith("/book"))) {
    return NextResponse.redirect(new URL(path.startsWith("/admin") ? "/admin/dashboard" : "/", req.url))
  }

  // Superadmin: only the platform admin email can access
  if (path.startsWith("/superadmin")) {
    const SUPER_ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@0tox.com"
    if (!session || session.email !== SUPER_ADMIN_EMAIL) {
      return NextResponse.redirect(new URL("/login", req.url))
    }
  }

  const isProtected =
    path.startsWith("/client") ||
    path.startsWith("/admin") ||
    path.startsWith("/employee")

  if (!session && isProtected) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  if (session && (path === "/login" || path === "/register")) {
    return NextResponse.redirect(new URL(dashboardFor(session.role), req.url))
  }

  if (session && path.startsWith("/admin") && session.role !== "admin") {
    return NextResponse.redirect(new URL(dashboardFor(session.role), req.url))
  }

  if (session && path.startsWith("/employee") && session.role !== "employee") {
    return NextResponse.redirect(new URL(dashboardFor(session.role), req.url))
  }

  if (session && path.startsWith("/client") && session.role !== "client") {
    return NextResponse.redirect(new URL(dashboardFor(session.role), req.url))
  }

  return res
}

export const config = {
  matcher: [
    // The landing route resolves a per-tenant homepage override, so it needs the
    // x-tenant-slug header too — without this, a subdomain's root renders the
    // default tenant instead of the owner's published site.
    "/",
    "/client/:path*",
    "/admin/:path*",
    "/employee/:path*",
    "/superadmin/:path*",
    "/login",
    "/register",
    "/api/:path*",
    "/s/:path*",
    "/shop/:path*",
    "/p/:path*",
  ],
}

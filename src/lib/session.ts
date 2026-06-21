import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"

const SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET ?? "fallback-dev-secret-change-in-production"
)
const COOKIE = "session"

// In production the session cookie is scoped to the parent domain (".site9.in")
// so it carries across subdomains — an owner who signs up on the main site stays
// logged in when they land on their own subdomain. Locally it stays host-only.
const COOKIE_DOMAIN =
  process.env.NODE_ENV === "production"
    ? `.${process.env.NEXT_PUBLIC_BASE_DOMAIN ?? "site9.in"}`
    : undefined

export type SessionPayload = {
  id: string
  email: string
  name: string
  role: "admin" | "client" | "employee"
  tenant_id: string
}

export async function createSession(payload: SessionPayload) {
  const token = await new SignJWT(payload as any)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("30d")
    .sign(SECRET)

  const cookieStore = await cookies()
  cookieStore.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
    domain: COOKIE_DOMAIN,
  })
}

export async function getSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(COOKIE)?.value
    if (!token) return null
    const { payload } = await jwtVerify(token, SECRET)
    return payload as unknown as SessionPayload
  } catch {
    return null
  }
}

export async function deleteSession() {
  const cookieStore = await cookies()
  // Clear with the same domain it was set on, or the cookie lingers.
  cookieStore.set(COOKIE, "", { httpOnly: true, maxAge: 0, path: "/", domain: COOKIE_DOMAIN })
}

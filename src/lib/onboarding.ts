/**
 * Self-serve onboarding helpers — shared by the /start wizard, the /build
 * flow, and the API routes that claim a subdomain and create a tenant.
 */

/** Business details a self-serve owner fills in while building their site. */
export interface BusinessDetails {
  name: string
  tagline?: string
  about?: string
  category?: string
  address?: string
  phone?: string
  whatsapp?: string
  email?: string
  hours?: string
  services?: string[]
}

/** The base domain used for the free subdomain (yourbusiness.<base>). */
export const BASE_DOMAIN =
  process.env.NEXT_PUBLIC_BASE_DOMAIN ?? "site9.in"

/** Build the full subdomain host for a slug, e.g. "cafe" → "cafe.site9.in". */
export function subdomainHost(slug: string): string {
  return `${slug}.${BASE_DOMAIN}`
}

/**
 * Turn a business name into a candidate subdomain slug: lowercase, ASCII,
 * hyphen-separated, no leading/trailing/double hyphens, max 40 chars.
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip combining accent marks
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 40)
    .replace(/-+$/g, "")
}

/**
 * Subdomains we never hand out — platform/system names and anything that would
 * collide with marketing or infra hosts. Matched case-insensitively.
 */
export const RESERVED_SLUGS = new Set([
  "www", "app", "admin", "api", "auth", "login", "register", "start", "build",
  "dashboard", "mail", "smtp", "ftp", "blog", "shop", "store", "cdn", "assets",
  "static", "img", "images", "media", "files", "support", "help", "docs", "status",
  "about", "contact", "pricing", "billing", "account", "settings", "superadmin",
  "client", "employee", "team", "dev", "staging", "test", "demo", "site9", "0tox",
  "ns1", "ns2", "mx", "email", "webmail", "portal", "secure", "my", "go",
])

export type SlugCheck =
  | { valid: true }
  | { valid: false; reason: string }

/** Validate a slug's *format* (availability is checked separately against the DB). */
export function validateSlug(slug: string): SlugCheck {
  if (slug.length < 3) return { valid: false, reason: "Must be at least 3 characters" }
  if (slug.length > 40) return { valid: false, reason: "Must be 40 characters or fewer" }
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
    return { valid: false, reason: "Use only lowercase letters, numbers, and hyphens" }
  }
  if (RESERVED_SLUGS.has(slug)) return { valid: false, reason: "This subdomain is reserved" }
  return { valid: true }
}

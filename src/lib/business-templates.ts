/**
 * Ready-made business website templates for the self-serve builder.
 *
 * Each template renders a self-contained homepage from a tenant's
 * {@link BusinessDetails}. Output is an `{ html, css }` pair stored in
 * `custom_pages` and rendered on the public subdomain through the same
 * `sanitizeHtml` / `sanitizeCss` pass the page builder uses — so the HTML
 * carries no <style>/<script> tags (CSS lives in the `css` field) and uses
 * only classes, inline styles, links, and images.
 */

import type { BusinessDetails } from "@/lib/onboarding"

export interface TemplateTheme {
  /** Page background + surface colors. */
  bg: string
  surface: string
  /** Brand accent used for buttons and highlights. */
  accent: string
  accentText: string
  /** Body + muted text. */
  text: string
  muted: string
  /** Font stack and hero treatment. */
  font: string
  heading: string
  radius: string
}

export interface BusinessTemplate {
  key: string
  name: string
  /** Industry this design is tuned for, shown in the gallery. */
  industry: string
  description: string
  theme: TemplateTheme
  /** Optional sample image used in the gallery preview card. */
  preview: string
  /** Extra sections beyond the standard hero/about/contact. */
  sections: Array<"services" | "hours" | "gallery">
}

function esc(value: string | undefined | null): string {
  if (!value) return ""
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

/** A clean tel: / wa.me link from a raw phone string. */
function digits(value: string | undefined): string {
  return (value ?? "").replace(/[^0-9]/g, "")
}

export const BUSINESS_TEMPLATES: BusinessTemplate[] = [
  {
    key: "cafe",
    name: "Warm Cafe",
    industry: "Cafe & Restaurant",
    description: "Cozy, appetite-friendly layout with menu highlights and opening hours.",
    preview: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=640&q=70",
    sections: ["services", "hours"],
    theme: {
      bg: "#fbf7f0", surface: "#ffffff", accent: "#b45309", accentText: "#ffffff",
      text: "#2a1c10", muted: "#7c6a58", font: "'Georgia', serif",
      heading: "'Georgia', serif", radius: "14px",
    },
  },
  {
    key: "salon",
    name: "Elegant Salon",
    industry: "Salon & Beauty",
    description: "Soft, modern look for salons and spas with a services list and booking CTA.",
    preview: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=640&q=70",
    sections: ["services", "hours"],
    theme: {
      bg: "#fdf2f8", surface: "#ffffff", accent: "#be185d", accentText: "#ffffff",
      text: "#3b0a26", muted: "#9b6b85", font: "'Helvetica Neue', Arial, sans-serif",
      heading: "'Helvetica Neue', Arial, sans-serif", radius: "9999px",
    },
  },
  {
    key: "photographer",
    name: "Studio Portfolio",
    industry: "Photography & Creative",
    description: "Dark, image-forward portfolio with a gallery grid to show your work.",
    preview: "https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=640&q=70",
    sections: ["gallery", "services"],
    theme: {
      bg: "#0b0b0f", surface: "#15151c", accent: "#e5e7eb", accentText: "#0b0b0f",
      text: "#f5f5f7", muted: "#9ca3af", font: "'Helvetica Neue', Arial, sans-serif",
      heading: "'Helvetica Neue', Arial, sans-serif", radius: "4px",
    },
  },
  {
    key: "shop",
    name: "Local Shop",
    industry: "Retail & Store",
    description: "Bright, friendly storefront with product highlights and a clear contact CTA.",
    preview: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=640&q=70",
    sections: ["services", "hours"],
    theme: {
      bg: "#f0fdf4", surface: "#ffffff", accent: "#15803d", accentText: "#ffffff",
      text: "#0f291a", muted: "#5b7766", font: "'Helvetica Neue', Arial, sans-serif",
      heading: "'Helvetica Neue', Arial, sans-serif", radius: "12px",
    },
  },
  {
    key: "professional",
    name: "Professional",
    industry: "Services & Consulting",
    description: "Crisp, trustworthy layout for consultants, freelancers, and service businesses.",
    preview: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=640&q=70",
    sections: ["services"],
    theme: {
      bg: "#f8fafc", surface: "#ffffff", accent: "#1d4ed8", accentText: "#ffffff",
      text: "#0f172a", muted: "#64748b", font: "'Helvetica Neue', Arial, sans-serif",
      heading: "'Helvetica Neue', Arial, sans-serif", radius: "10px",
    },
  },
]

export function getBusinessTemplate(key: string): BusinessTemplate {
  return BUSINESS_TEMPLATES.find(t => t.key === key) ?? BUSINESS_TEMPLATES[BUSINESS_TEMPLATES.length - 1]
}

/** Render the contact action buttons shared by every template. */
function actions(b: BusinessDetails): string {
  const parts: string[] = []
  const wa = digits(b.whatsapp || b.phone)
  if (wa) parts.push(`<a class="s9-btn" href="https://wa.me/${wa}" target="_blank" rel="noopener">Message on WhatsApp</a>`)
  if (b.phone) parts.push(`<a class="s9-btn s9-btn-ghost" href="tel:${esc(b.phone)}">Call ${esc(b.phone)}</a>`)
  if (!wa && !b.phone && b.email) parts.push(`<a class="s9-btn" href="mailto:${esc(b.email)}">Email us</a>`)
  return parts.length ? `<div class="s9-actions">${parts.join("")}</div>` : ""
}

function servicesSection(b: BusinessDetails): string {
  const items = (b.services ?? []).filter(Boolean)
  if (!items.length) return ""
  const cards = items
    .map(s => `<div class="s9-card"><h3>${esc(s)}</h3></div>`)
    .join("")
  return `<section class="s9-section">
  <h2>What we offer</h2>
  <div class="s9-grid">${cards}</div>
</section>`
}

function hoursSection(b: BusinessDetails): string {
  if (!b.hours) return ""
  return `<section class="s9-section s9-hours">
  <h2>Opening hours</h2>
  <p>${esc(b.hours).replace(/\n/g, "<br>")}</p>
</section>`
}

function gallerySection(): string {
  // Placeholder tiles the owner can replace later in the page editor.
  const tiles = Array.from({ length: 6 })
    .map(() => `<div class="s9-tile"></div>`)
    .join("")
  return `<section class="s9-section">
  <h2>Gallery</h2>
  <div class="s9-gallery">${tiles}</div>
</section>`
}

function contactSection(b: BusinessDetails): string {
  const rows: string[] = []
  if (b.address) rows.push(`<p class="s9-contact-row">📍 ${esc(b.address)}</p>`)
  if (b.phone) rows.push(`<p class="s9-contact-row">📞 <a href="tel:${esc(b.phone)}">${esc(b.phone)}</a></p>`)
  if (b.email) rows.push(`<p class="s9-contact-row">✉️ <a href="mailto:${esc(b.email)}">${esc(b.email)}</a></p>`)
  const map = b.address
    ? `<a class="s9-btn s9-btn-ghost" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.address)}" target="_blank" rel="noopener">Open in Maps</a>`
    : ""
  if (!rows.length) return ""
  return `<section class="s9-section s9-contact" id="contact">
  <h2>Visit or get in touch</h2>
  ${rows.join("\n  ")}
  ${map}
</section>`
}

/** Build the full `{ html, css }` homepage for a template + business details. */
export function renderBusinessTemplate(
  key: string,
  b: BusinessDetails,
): { html: string; css: string } {
  const tpl = getBusinessTemplate(key)
  const t = tpl.theme
  const extra: Record<string, () => string> = {
    services: () => servicesSection(b),
    hours: () => hoursSection(b),
    gallery: () => gallerySection(),
  }
  const middle = tpl.sections.map(s => extra[s]()).filter(Boolean).join("\n")

  const html = `<div class="s9-site">
  <header class="s9-hero">
    <div class="s9-hero-inner">
      <h1>${esc(b.name)}</h1>
      ${b.tagline ? `<p class="s9-tagline">${esc(b.tagline)}</p>` : ""}
      ${actions(b)}
    </div>
  </header>

  ${b.about ? `<section class="s9-section s9-about"><h2>About us</h2><p>${esc(b.about).replace(/\n/g, "<br>")}</p></section>` : ""}
  ${middle}
  ${contactSection(b)}

  <footer class="s9-footer">
    <p>&copy; ${esc(b.name)}</p>
    <p class="s9-badge">Made with Site9</p>
  </footer>
</div>`

  const css = `.s9-site { font-family: ${t.font}; color: ${t.text}; background: ${t.bg}; margin: 0; }
.s9-site h1, .s9-site h2, .s9-site h3 { font-family: ${t.heading}; }
.s9-site a { color: inherit; }
.s9-hero { background: ${t.surface}; padding: 96px 24px; text-align: center; border-bottom: 1px solid rgba(0,0,0,.06); }
.s9-hero-inner { max-width: 760px; margin: 0 auto; }
.s9-hero h1 { font-size: 46px; margin: 0 0 12px; letter-spacing: -0.5px; }
.s9-tagline { font-size: 20px; color: ${t.muted}; margin: 0 0 28px; }
.s9-actions { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
.s9-btn { display: inline-block; background: ${t.accent}; color: ${t.accentText}; padding: 13px 26px; border-radius: ${t.radius}; text-decoration: none; font-weight: 600; }
.s9-btn-ghost { background: transparent; color: ${t.accent}; border: 1px solid ${t.accent}; }
.s9-section { max-width: 960px; margin: 0 auto; padding: 64px 24px; }
.s9-section h2 { font-size: 30px; margin: 0 0 24px; text-align: center; }
.s9-about p { font-size: 18px; line-height: 1.7; color: ${t.muted}; text-align: center; max-width: 680px; margin: 0 auto; }
.s9-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }
.s9-card { background: ${t.surface}; border: 1px solid rgba(0,0,0,.08); border-radius: ${t.radius === "9999px" ? "16px" : t.radius}; padding: 24px; text-align: center; }
.s9-card h3 { margin: 0; font-size: 18px; }
.s9-hours { text-align: center; }
.s9-hours p { font-size: 18px; color: ${t.muted}; line-height: 1.9; }
.s9-gallery { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; }
.s9-tile { aspect-ratio: 1; background: linear-gradient(135deg, ${t.muted}33, ${t.accent}55); border-radius: ${t.radius === "9999px" ? "12px" : t.radius}; }
.s9-contact { text-align: center; }
.s9-contact-row { font-size: 18px; margin: 8px 0; color: ${t.muted}; }
.s9-contact .s9-btn-ghost { margin-top: 16px; }
.s9-footer { padding: 40px 24px; text-align: center; color: ${t.muted}; border-top: 1px solid rgba(0,0,0,.06); }
.s9-badge { font-size: 12px; opacity: .7; margin-top: 4px; }
@media (max-width: 600px) { .s9-hero { padding: 64px 20px; } .s9-hero h1 { font-size: 34px; } }`

  return { html, css }
}

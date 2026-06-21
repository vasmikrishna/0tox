/**
 * Server-safe HTML sanitizer for admin-authored custom pages.
 *
 * The existing project-assets workspace sanitizer uses the browser `DOMParser`,
 * which is unavailable in React Server Components / route handlers. This is a
 * dependency-free, regex-based pass intended for *trusted-ish* admin authors:
 * it removes the high-risk vectors (script/style/iframe/object/embed tags,
 * inline event handlers, and javascript: URLs) while leaving normal markup,
 * inline styles, classes, links, and images intact.
 *
 * It is intentionally conservative, not a replacement for a full HTML parser.
 * Custom pages are authored by authenticated tenant admins, so the threat model
 * is "don't let a pasted snippet run arbitrary JS on the public site", not
 * "defend against a hostile multi-tenant attacker". If untrusted authors are
 * ever allowed, swap this for a DOM-based sanitizer (e.g. isomorphic-dompurify).
 */

const DANGEROUS_TAGS = ["script", "style", "iframe", "object", "embed", "link", "meta", "base"]

export function sanitizeHtml(input: string | null | undefined): string {
  if (!input) return ""
  let html = input

  // Strip dangerous tags and their contents (script/style) or the tags themselves.
  for (const tag of DANGEROUS_TAGS) {
    // Paired tags with content (e.g. <script>...</script>)
    html = html.replace(new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}>`, "gi"), "")
    // Any stray opening/self-closing or closing tag
    html = html.replace(new RegExp(`<\\/?${tag}\\b[^>]*>`, "gi"), "")
  }

  // Remove inline event handlers: on*="..." / on*='...' / on*=value
  html = html.replace(/\son[a-z]+\s*=\s*"[^"]*"/gi, "")
  html = html.replace(/\son[a-z]+\s*=\s*'[^']*'/gi, "")
  html = html.replace(/\son[a-z]+\s*=\s*[^\s>]+/gi, "")

  // Neutralise javascript: and data:text/html URLs in href/src/style.
  html = html.replace(/(href|src|xlink:href)\s*=\s*"(\s*javascript:|\s*data:text\/html)[^"]*"/gi, '$1="#"')
  html = html.replace(/(href|src|xlink:href)\s*=\s*'(\s*javascript:|\s*data:text\/html)[^']*'/gi, "$1='#'")
  html = html.replace(/(url\(\s*['"]?\s*)javascript:[^)]*\)/gi, "url()")

  return html
}

/**
 * Wrap author CSS so it cannot break out via </style>. Returns a style string
 * safe to inline alongside sanitized HTML.
 */
export function sanitizeCss(input: string | null | undefined): string {
  if (!input) return ""
  // Prevent closing the style element early; strip any HTML tags from CSS.
  return input.replace(/<\/?\s*style/gi, "").replace(/<[^>]*>/g, "")
}

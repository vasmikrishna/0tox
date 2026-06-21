# Page Builder (custom HTML pages)

Per-tenant, Wix-style custom pages: start from a template, edit raw HTML/CSS, preview, publish. A published page can override the public homepage.

## Data model
- **custom_pages** — `slug, title, html, css, template, status (draft|published), is_homepage`. Unique `(tenant_id, slug)`; partial unique index enforces **one homepage per tenant**.

## Surfaces
| Area | Path |
|------|------|
| Admin list / new | `/admin/pages` |
| Admin editor | `/admin/pages/[id]` (HTML+CSS editors, live iframe preview, publish, set-homepage, delete) |
| Page APIs | `/api/admin/pages`, `/api/admin/pages/[id]` |
| Public render | `/p/[slug]` (full-bleed, no site header/footer) |
| Homepage override | `/` renders the published `is_homepage` page if present |

## Templates
`src/lib/page-templates.ts` — `landing`, `portfolio`, `coming-soon`, `blank`. Creating a page seeds its HTML/CSS from the chosen template.

## Security
All stored HTML/CSS is **sanitized at render time** via `src/lib/sanitize-html.ts` (strips `script`/`style`/`iframe`/`object`/`embed`/`link`/`meta`/`base`, inline `on*` handlers, and `javascript:`/`data:text/html` URLs). The editor preview sanitizes client-side too and uses a sandboxed iframe.

> Authors are trusted tenant admins. If untrusted authors are ever allowed, replace the regex sanitizer with a DOM-based one (e.g. `isomorphic-dompurify`).

## Notes / future
- v1 is a template + code editor (matches "create some HTML and publish it"), not a drag-and-drop block builder.
- No per-page custom domains yet.

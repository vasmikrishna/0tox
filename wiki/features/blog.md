# Blog — per-tenant, SEO-first

A blog every tenant gets out of the box. Each tenant's admin authors posts with a
TipTap rich-text editor; the super-admin can oversee/moderate across all tenants.
Available to **all tenants** behind `FEATURES.blog` (currently on).

## Data model
- **blog_posts** (tenant-scoped, `unique(tenant_id, slug)`) — `title`, `slug`,
  `excerpt`, `content_html` (sanitized on render) + `content_json` (TipTap doc),
  `cover_image_url`, `author_name`, `tags text[]`, `status (draft|published)`,
  `published_at`, timestamps.
- **SEO columns** — `meta_title`, `meta_description`, `og_image_url`,
  `canonical_url`, `noindex`.
- Migration `016_blog.sql` (grants added, RLS disabled to match existing tables).

## Surfaces
| Area | Path |
|------|------|
| Admin list | `/admin/blog` (`blog-list.tsx`) |
| Admin create / edit | `/admin/blog/new`, `/admin/blog/[id]` (`blog-form.tsx`) |
| Editor component | `src/components/admin/blog-editor.tsx` (TipTap) |
| Super-admin oversight | `/superadmin/blog` (cross-tenant, publish/unpublish, delete) |
| Public index | `/blog` |
| Public post | `/blog/[slug]` |
| Admin API | `GET/POST /api/admin/blog`, `GET/PATCH/DELETE /api/admin/blog/[id]` |
| Super-admin API | `GET /api/superadmin/blog`, `PATCH/DELETE /api/superadmin/blog/[id]` |
| Article JSON-LD | `buildArticleJsonLd` in `src/lib/seo.ts` |
| Sitemap | `/blog` + published posts in `src/app/sitemap.ts` |

## Editor
TipTap (`@tiptap/react` + starter-kit + underline/link/highlight/text-style/color/
placeholder — all already in `package.json`). Cover images upload via the existing
`POST /api/build/upload` (R2). Output is stored as both HTML and JSON; the public
page renders `sanitizeHtml(content_html)`.

## SEO
- `generateMetadata` on `/blog/[slug]` uses `meta_title || title`,
  `meta_description || excerpt`, `canonical_url || <origin>/blog/<slug>`, OpenGraph
  image from `og_image_url || cover_image_url`, and honors `noindex`.
- Each post emits **BlogPosting** JSON-LD (author + publisher + dates).
- Published posts and `/blog` are added to the tenant sitemap.

## Access
- **Tenant admins** (`role === "admin"`): full CRUD over their own tenant's posts.
- **Super-admin** (`ADMIN_EMAIL`): read + moderate (publish/unpublish/delete) across
  all tenants at `/superadmin/blog`.

## Notes / future
- Apply migration `016_blog.sql`.
- Possible next: scheduled publishing, categories, RSS feed, related posts,
  reading time, author profiles.

/**
 * Curated website templates for the self-serve builder.
 *
 * Each template is a complete HTML+CSS pair with `data-s9-edit` markers on
 * editable zones. The markers survive the sanitizer (`data-*` is allowed) and
 * are stripped before publish via {@link stripEditorMarkers}.
 *
 * Templates are universal — they work across all business categories. The
 * category influences the AI-generated copy and placeholder images, not the
 * HTML structure.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CuratedTemplate {
  key: string
  name: string
  description: string
  preview: string
}

export interface CategoryDef {
  key: string
  label: string
  icon: string
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export const CATEGORIES: CategoryDef[] = [
  { key: "restaurant", label: "Restaurant / Cafe", icon: "🍽️" },
  { key: "salon", label: "Salon / Beauty", icon: "💇" },
  { key: "photography", label: "Photography", icon: "📷" },
  { key: "professional", label: "Professional", icon: "💼" },
  { key: "retail", label: "Retail / Shop", icon: "🛍️" },
  { key: "other", label: "Other", icon: "🌐" },
]

// ---------------------------------------------------------------------------
// Category-aware placeholder images (Unsplash, no API key needed)
// ---------------------------------------------------------------------------

const CATEGORY_IMAGES: Record<string, { hero: string; gallery: string[] }> = {
  restaurant: {
    hero: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=70",
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=70",
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&q=70",
    ],
  },
  salon: {
    hero: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&q=70",
      "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=600&q=70",
      "https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=600&q=70",
    ],
  },
  photography: {
    hero: "https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&q=70",
      "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&q=70",
      "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600&q=70",
    ],
  },
  professional: {
    hero: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1553028826-f4804a6dba3b?w=600&q=70",
      "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=600&q=70",
      "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&q=70",
    ],
  },
  retail: {
    hero: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=600&q=70",
      "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&q=70",
      "https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=600&q=70",
    ],
  },
  other: {
    hero: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1553028826-f4804a6dba3b?w=600&q=70",
      "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=600&q=70",
      "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&q=70",
    ],
  },
}

export function getCategoryImages(category: string) {
  return CATEGORY_IMAGES[category] ?? CATEGORY_IMAGES.other
}

// ---------------------------------------------------------------------------
// Template gallery metadata
// ---------------------------------------------------------------------------

export const CURATED_TEMPLATES: CuratedTemplate[] = [
  {
    key: "bold",
    name: "Bold",
    description: "Dark hero, accent buttons, strong presence",
    preview: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=640&q=70",
  },
  {
    key: "clean",
    name: "Clean",
    description: "Light, modern, full-width sections",
    preview: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=640&q=70",
  },
  {
    key: "warm",
    name: "Warm",
    description: "Earth tones, serif headings, friendly feel",
    preview: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=640&q=70",
  },
  {
    key: "minimal",
    name: "Minimal",
    description: "Whitespace, centered, elegant",
    preview: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=640&q=70",
  },
]

export function getCuratedTemplate(key: string): CuratedTemplate {
  return CURATED_TEMPLATES.find((t) => t.key === key) ?? CURATED_TEMPLATES[0]
}

// ---------------------------------------------------------------------------
// Editable zone keys (shared between templates, AI fill, and editor)
// ---------------------------------------------------------------------------

export const EDIT_ZONES = [
  "hero-heading",
  "hero-tagline",
  "hero-image",
  "about-heading",
  "about-body",
  "services-heading",
  "service-1",
  "service-2",
  "service-3",
  "gallery-1",
  "gallery-2",
  "gallery-3",
  "contact-heading",
  "contact-body",
] as const

export type EditZoneKey = (typeof EDIT_ZONES)[number]

// ---------------------------------------------------------------------------
// Template HTML builders
// ---------------------------------------------------------------------------

function sharedSections(heroImg: string, galleryImgs: string[]) {
  return {
    hero: (heading: string, tagline: string) => `
    <header class="s9-hero">
      <img data-s9-edit="hero-image" data-s9-type="image" class="s9-hero-bg" src="${heroImg}" alt="" />
      <div class="s9-hero-overlay"></div>
      <div class="s9-hero-inner">
        <h1 data-s9-edit="hero-heading" data-s9-type="text">${heading}</h1>
        <p data-s9-edit="hero-tagline" data-s9-type="text" class="s9-tagline">${tagline}</p>
      </div>
    </header>`,

    about: () => `
    <section class="s9-section s9-about">
      <h2 data-s9-edit="about-heading" data-s9-type="text">About Us</h2>
      <p data-s9-edit="about-body" data-s9-type="text" class="s9-about-text">We are passionate about what we do. Our team brings years of experience and dedication to every customer interaction.</p>
    </section>`,

    services: () => `
    <section class="s9-section s9-services">
      <h2 data-s9-edit="services-heading" data-s9-type="text">Our Services</h2>
      <div class="s9-grid">
        <div class="s9-card" data-s9-edit="service-1" data-s9-type="text"><h3>Service One</h3><p>A short description of what you offer.</p></div>
        <div class="s9-card" data-s9-edit="service-2" data-s9-type="text"><h3>Service Two</h3><p>A short description of what you offer.</p></div>
        <div class="s9-card" data-s9-edit="service-3" data-s9-type="text"><h3>Service Three</h3><p>A short description of what you offer.</p></div>
      </div>
    </section>`,

    gallery: () => `
    <section class="s9-section s9-gallery">
      <div class="s9-gallery-grid">
        <img data-s9-edit="gallery-1" data-s9-type="image" src="${galleryImgs[0]}" alt="Gallery" class="s9-gallery-img" />
        <img data-s9-edit="gallery-2" data-s9-type="image" src="${galleryImgs[1]}" alt="Gallery" class="s9-gallery-img" />
        <img data-s9-edit="gallery-3" data-s9-type="image" src="${galleryImgs[2]}" alt="Gallery" class="s9-gallery-img" />
      </div>
    </section>`,

    contact: () => `
    <section class="s9-section s9-contact">
      <h2 data-s9-edit="contact-heading" data-s9-type="text">Get in Touch</h2>
      <p data-s9-edit="contact-body" data-s9-type="text" class="s9-contact-text">Visit us or reach out — we'd love to hear from you.</p>
    </section>`,

    footer: () => `
    <footer class="s9-footer">
      <p>Made with Site9</p>
    </footer>`,
  }
}

// ---------------------------------------------------------------------------
// Bold template
// ---------------------------------------------------------------------------

function boldHtml(heroImg: string, galleryImgs: string[]): string {
  const s = sharedSections(heroImg, galleryImgs)
  return `<div class="s9-site s9-bold">
${s.hero("Your Business Name", "A bold tagline that captures attention")}
${s.about()}
${s.services()}
${s.gallery()}
${s.contact()}
${s.footer()}
</div>`
}

const BOLD_CSS = `
.s9-bold { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; color: #f0f0f0; background: #0b0b0f; }
.s9-bold .s9-hero { position: relative; min-height: 520px; display: flex; align-items: center; justify-content: center; overflow: hidden; }
.s9-bold .s9-hero-bg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.s9-bold .s9-hero-overlay { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.5) 100%); }
.s9-bold .s9-hero-inner { position: relative; z-index: 1; text-align: center; padding: 3rem 1.5rem; max-width: 700px; }
.s9-bold .s9-hero-inner h1 { font-size: clamp(2.4rem, 5vw, 3.6rem); font-weight: 800; letter-spacing: -0.02em; line-height: 1.1; margin: 0; }
.s9-bold .s9-tagline { font-size: 1.15rem; margin-top: 1rem; color: #c0c0c0; }
.s9-bold .s9-section { max-width: 960px; margin: 0 auto; padding: 4rem 1.5rem; }
.s9-bold .s9-section h2 { font-size: 1.8rem; font-weight: 700; margin-bottom: 1.5rem; color: #ffffff; }
.s9-bold .s9-about-text { font-size: 1.05rem; line-height: 1.7; color: #b0b0b0; max-width: 640px; }
.s9-bold .s9-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1.5rem; }
.s9-bold .s9-card { background: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 2rem; }
.s9-bold .s9-card h3 { font-size: 1.15rem; font-weight: 600; margin: 0 0 0.5rem; color: #22d3ee; }
.s9-bold .s9-card p { color: #a0a0a0; font-size: 0.95rem; line-height: 1.5; margin: 0; }
.s9-bold .s9-gallery-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; max-width: 960px; margin: 0 auto; padding: 0 1.5rem 3rem; }
.s9-bold .s9-gallery-img { width: 100%; aspect-ratio: 4/3; object-fit: cover; border-radius: 10px; }
.s9-bold .s9-contact { text-align: center; }
.s9-bold .s9-contact-text { color: #b0b0b0; font-size: 1.05rem; }
.s9-bold .s9-footer { text-align: center; padding: 2rem 1rem; color: #555; font-size: 0.85rem; border-top: 1px solid #1e1e1e; }
@media (max-width: 640px) {
  .s9-bold .s9-gallery-grid { grid-template-columns: 1fr; }
  .s9-bold .s9-hero { min-height: 380px; }
}
`

// ---------------------------------------------------------------------------
// Clean template
// ---------------------------------------------------------------------------

function cleanHtml(heroImg: string, galleryImgs: string[]): string {
  const s = sharedSections(heroImg, galleryImgs)
  return `<div class="s9-site s9-clean">
${s.hero("Your Business Name", "Clean, modern, professional")}
${s.about()}
${s.services()}
${s.gallery()}
${s.contact()}
${s.footer()}
</div>`
}

const CLEAN_CSS = `
.s9-clean { font-family: 'Inter', system-ui, -apple-system, sans-serif; color: #1a1a2e; background: #ffffff; }
.s9-clean .s9-hero { position: relative; min-height: 480px; display: flex; align-items: center; justify-content: center; overflow: hidden; }
.s9-clean .s9-hero-bg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.s9-clean .s9-hero-overlay { position: absolute; inset: 0; background: rgba(255,255,255,0.82); }
.s9-clean .s9-hero-inner { position: relative; z-index: 1; text-align: center; padding: 3rem 1.5rem; max-width: 660px; }
.s9-clean .s9-hero-inner h1 { font-size: clamp(2.2rem, 5vw, 3.2rem); font-weight: 700; letter-spacing: -0.02em; line-height: 1.15; margin: 0; color: #111; }
.s9-clean .s9-tagline { font-size: 1.1rem; margin-top: 0.75rem; color: #555; }
.s9-clean .s9-section { max-width: 920px; margin: 0 auto; padding: 4rem 1.5rem; }
.s9-clean .s9-section h2 { font-size: 1.6rem; font-weight: 600; margin-bottom: 1.25rem; color: #111; }
.s9-clean .s9-about-text { font-size: 1rem; line-height: 1.75; color: #444; max-width: 620px; }
.s9-clean .s9-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.25rem; }
.s9-clean .s9-card { background: #f8f9fa; border: 1px solid #e5e7eb; border-radius: 10px; padding: 1.75rem; }
.s9-clean .s9-card h3 { font-size: 1.1rem; font-weight: 600; margin: 0 0 0.4rem; color: #2563eb; }
.s9-clean .s9-card p { color: #555; font-size: 0.92rem; line-height: 1.5; margin: 0; }
.s9-clean .s9-gallery-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; max-width: 920px; margin: 0 auto; padding: 0 1.5rem 3rem; }
.s9-clean .s9-gallery-img { width: 100%; aspect-ratio: 4/3; object-fit: cover; border-radius: 8px; }
.s9-clean .s9-contact { text-align: center; background: #f8f9fa; border-radius: 14px; }
.s9-clean .s9-contact-text { color: #555; font-size: 1rem; }
.s9-clean .s9-footer { text-align: center; padding: 2rem 1rem; color: #aaa; font-size: 0.85rem; border-top: 1px solid #eee; }
@media (max-width: 640px) {
  .s9-clean .s9-gallery-grid { grid-template-columns: 1fr; }
}
`

// ---------------------------------------------------------------------------
// Warm template
// ---------------------------------------------------------------------------

function warmHtml(heroImg: string, galleryImgs: string[]): string {
  const s = sharedSections(heroImg, galleryImgs)
  return `<div class="s9-site s9-warm">
${s.hero("Your Business Name", "Warm, welcoming, and personal")}
${s.about()}
${s.services()}
${s.gallery()}
${s.contact()}
${s.footer()}
</div>`
}

const WARM_CSS = `
.s9-warm { font-family: Georgia, 'Times New Roman', serif; color: #2a1c10; background: #faf6f1; }
.s9-warm .s9-hero { position: relative; min-height: 480px; display: flex; align-items: center; justify-content: center; overflow: hidden; }
.s9-warm .s9-hero-bg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.s9-warm .s9-hero-overlay { position: absolute; inset: 0; background: rgba(42,28,16,0.55); }
.s9-warm .s9-hero-inner { position: relative; z-index: 1; text-align: center; padding: 3rem 1.5rem; max-width: 640px; }
.s9-warm .s9-hero-inner h1 { font-size: clamp(2.2rem, 5vw, 3.2rem); font-weight: 700; line-height: 1.15; margin: 0; color: #fff; }
.s9-warm .s9-tagline { font-size: 1.1rem; margin-top: 0.75rem; color: #e8d5c4; font-style: italic; }
.s9-warm .s9-section { max-width: 880px; margin: 0 auto; padding: 3.5rem 1.5rem; }
.s9-warm .s9-section h2 { font-size: 1.7rem; font-weight: 700; margin-bottom: 1.25rem; color: #3d2b1f; }
.s9-warm .s9-about-text { font-size: 1.05rem; line-height: 1.8; color: #5c4a3a; max-width: 600px; }
.s9-warm .s9-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.25rem; }
.s9-warm .s9-card { background: #fff; border: 1px solid #e5d9cc; border-radius: 14px; padding: 1.75rem; }
.s9-warm .s9-card h3 { font-size: 1.1rem; font-weight: 700; margin: 0 0 0.4rem; color: #b45309; }
.s9-warm .s9-card p { color: #6b5744; font-size: 0.92rem; line-height: 1.5; margin: 0; }
.s9-warm .s9-gallery-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; max-width: 880px; margin: 0 auto; padding: 0 1.5rem 3rem; }
.s9-warm .s9-gallery-img { width: 100%; aspect-ratio: 4/3; object-fit: cover; border-radius: 12px; }
.s9-warm .s9-contact { text-align: center; }
.s9-warm .s9-contact-text { color: #6b5744; font-size: 1.05rem; }
.s9-warm .s9-footer { text-align: center; padding: 2rem 1rem; color: #b5a08a; font-size: 0.85rem; border-top: 1px solid #e5d9cc; }
@media (max-width: 640px) {
  .s9-warm .s9-gallery-grid { grid-template-columns: 1fr; }
}
`

// ---------------------------------------------------------------------------
// Minimal template
// ---------------------------------------------------------------------------

function minimalHtml(heroImg: string, galleryImgs: string[]): string {
  const s = sharedSections(heroImg, galleryImgs)
  return `<div class="s9-site s9-minimal">
${s.hero("Your Business Name", "Less is more")}
${s.about()}
${s.services()}
${s.gallery()}
${s.contact()}
${s.footer()}
</div>`
}

const MINIMAL_CSS = `
.s9-minimal { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #222; background: #fff; }
.s9-minimal .s9-hero { position: relative; min-height: 440px; display: flex; align-items: center; justify-content: center; overflow: hidden; }
.s9-minimal .s9-hero-bg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0.15; }
.s9-minimal .s9-hero-overlay { display: none; }
.s9-minimal .s9-hero-inner { position: relative; z-index: 1; text-align: center; padding: 4rem 1.5rem; max-width: 560px; }
.s9-minimal .s9-hero-inner h1 { font-size: clamp(2rem, 4.5vw, 2.8rem); font-weight: 300; letter-spacing: 0.04em; text-transform: uppercase; line-height: 1.25; margin: 0; color: #111; }
.s9-minimal .s9-tagline { font-size: 1rem; margin-top: 1rem; color: #888; letter-spacing: 0.03em; }
.s9-minimal .s9-section { max-width: 720px; margin: 0 auto; padding: 4rem 1.5rem; text-align: center; }
.s9-minimal .s9-section h2 { font-size: 1.3rem; font-weight: 400; letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 1.5rem; color: #333; }
.s9-minimal .s9-about-text { font-size: 1rem; line-height: 1.85; color: #555; }
.s9-minimal .s9-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 2rem; text-align: left; }
.s9-minimal .s9-card { padding: 1.5rem 0; border-top: 1px solid #e0e0e0; }
.s9-minimal .s9-card h3 { font-size: 1rem; font-weight: 600; margin: 0 0 0.3rem; }
.s9-minimal .s9-card p { color: #777; font-size: 0.9rem; line-height: 1.5; margin: 0; }
.s9-minimal .s9-gallery-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; max-width: 720px; margin: 0 auto; padding: 0 1.5rem 3rem; }
.s9-minimal .s9-gallery-img { width: 100%; aspect-ratio: 1/1; object-fit: cover; }
.s9-minimal .s9-contact-text { color: #666; font-size: 1rem; }
.s9-minimal .s9-footer { text-align: center; padding: 3rem 1rem; color: #bbb; font-size: 0.8rem; }
@media (max-width: 640px) {
  .s9-minimal .s9-gallery-grid { grid-template-columns: 1fr; }
}
`

// ---------------------------------------------------------------------------
// Template rendering
// ---------------------------------------------------------------------------

const TEMPLATE_BUILDERS: Record<string, (heroImg: string, galleryImgs: string[]) => string> = {
  bold: boldHtml,
  clean: cleanHtml,
  warm: warmHtml,
  minimal: minimalHtml,
}

const TEMPLATE_CSS: Record<string, string> = {
  bold: BOLD_CSS,
  clean: CLEAN_CSS,
  warm: WARM_CSS,
  minimal: MINIMAL_CSS,
}

export function renderCuratedTemplate(
  templateKey: string,
  category: string,
): { html: string; css: string } {
  const builder = TEMPLATE_BUILDERS[templateKey] ?? TEMPLATE_BUILDERS.bold
  const css = TEMPLATE_CSS[templateKey] ?? TEMPLATE_CSS.bold
  const imgs = getCategoryImages(category)
  return { html: builder(imgs.hero, imgs.gallery), css }
}

// ---------------------------------------------------------------------------
// Editor marker stripping (called before publish)
// ---------------------------------------------------------------------------

export function stripEditorMarkers(html: string): string {
  return html
    .replace(/\s*data-s9-edit="[^"]*"/g, "")
    .replace(/\s*data-s9-type="[^"]*"/g, "")
    .replace(/\s*class="s9-selected"/g, "")
}

// ---------------------------------------------------------------------------
// Extract editable zones for the AI fill prompt
// ---------------------------------------------------------------------------

export function extractEditZones(html: string): string[] {
  const re = /data-s9-edit="([^"]*)"/g
  const keys: string[] = []
  let m: RegExpExecArray | null
  while ((m = re.exec(html)) !== null) keys.push(m[1])
  return keys
}

/**
 * Starter templates for the page builder. Each template is a self-contained
 * HTML + CSS pair the admin can pick and then customise in the editor.
 * Keep markup simple and inline-class based so authors can tweak freely.
 */

export interface PageTemplate {
  key: string
  name: string
  description: string
  html: string
  css: string
}

const landing: PageTemplate = {
  key: "landing",
  name: "Landing Page",
  description: "Hero, features, and a call to action — a classic one-pager.",
  html: `<section class="hero">
  <h1>Your big idea starts here</h1>
  <p>A clean, fast landing page you can edit in seconds. Swap this copy for your own message.</p>
  <a class="btn" href="#contact">Get started</a>
</section>

<section class="features">
  <div class="feature">
    <h3>Fast</h3>
    <p>Built for speed and clarity so visitors get the message instantly.</p>
  </div>
  <div class="feature">
    <h3>Flexible</h3>
    <p>Edit the HTML and CSS directly — total control over every pixel.</p>
  </div>
  <div class="feature">
    <h3>Yours</h3>
    <p>Publish under your brand and update whenever you like.</p>
  </div>
</section>

<section class="cta" id="contact">
  <h2>Ready when you are</h2>
  <p>Hit publish and share your new page with the world.</p>
  <a class="btn" href="mailto:hello@example.com">Contact us</a>
</section>`,
  css: `.hero { text-align: center; padding: 96px 24px; background: #0f172a; color: #fff; }
.hero h1 { font-size: 48px; margin: 0 0 16px; }
.hero p { font-size: 18px; opacity: .85; max-width: 560px; margin: 0 auto 28px; }
.btn { display: inline-block; background: #6366f1; color: #fff; padding: 14px 28px; border-radius: 9999px; text-decoration: none; font-weight: 600; }
.features { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 24px; padding: 72px 24px; max-width: 960px; margin: 0 auto; }
.feature h3 { font-size: 20px; margin: 0 0 8px; }
.feature p { color: #475569; margin: 0; }
.cta { text-align: center; padding: 80px 24px; background: #f1f5f9; }
.cta h2 { font-size: 32px; margin: 0 0 12px; }
.cta p { color: #475569; margin: 0 0 24px; }`,
}

const comingSoon: PageTemplate = {
  key: "coming-soon",
  name: "Coming Soon",
  description: "A minimal pre-launch teaser with an email capture.",
  html: `<main class="wrap">
  <div class="badge">Launching soon</div>
  <h1>Something great is on the way</h1>
  <p>We're putting the finishing touches on it. Leave your email and we'll let you know the moment we go live.</p>
  <form class="signup" onsubmit="return false">
    <input type="email" placeholder="you@example.com" aria-label="Email address" />
    <button type="submit">Notify me</button>
  </form>
</main>`,
  css: `.wrap { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 24px; background: radial-gradient(circle at top, #1e293b, #020617); color: #e2e8f0; }
.badge { text-transform: uppercase; letter-spacing: .15em; font-size: 12px; color: #818cf8; margin-bottom: 16px; }
.wrap h1 { font-size: 44px; margin: 0 0 16px; }
.wrap p { max-width: 480px; opacity: .8; margin: 0 0 28px; }
.signup { display: flex; gap: 8px; }
.signup input { padding: 12px 16px; border-radius: 8px; border: 1px solid #334155; background: #0f172a; color: #fff; }
.signup button { padding: 12px 20px; border-radius: 8px; border: 0; background: #6366f1; color: #fff; font-weight: 600; cursor: pointer; }`,
}

const portfolio: PageTemplate = {
  key: "portfolio",
  name: "Portfolio",
  description: "Intro plus a responsive grid of work or products.",
  html: `<header class="intro">
  <h1>Selected work</h1>
  <p>A showcase of recent projects. Replace these cards with your own.</p>
</header>

<section class="grid">
  <article class="card">
    <div class="thumb"></div>
    <h3>Project One</h3>
    <p>Short description of the work and the result it delivered.</p>
  </article>
  <article class="card">
    <div class="thumb"></div>
    <h3>Project Two</h3>
    <p>Short description of the work and the result it delivered.</p>
  </article>
  <article class="card">
    <div class="thumb"></div>
    <h3>Project Three</h3>
    <p>Short description of the work and the result it delivered.</p>
  </article>
</section>`,
  css: `.intro { padding: 72px 24px 24px; max-width: 960px; margin: 0 auto; }
.intro h1 { font-size: 40px; margin: 0 0 8px; }
.intro p { color: #475569; margin: 0; }
.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 24px; padding: 24px; max-width: 960px; margin: 0 auto 72px; }
.card { border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
.thumb { aspect-ratio: 16/10; background: linear-gradient(135deg, #c7d2fe, #6366f1); }
.card h3 { margin: 16px 16px 4px; }
.card p { margin: 0 16px 16px; color: #475569; font-size: 14px; }`,
}

const blank: PageTemplate = {
  key: "blank",
  name: "Blank",
  description: "Start from scratch with an empty canvas.",
  html: `<section style="padding: 80px 24px; text-align: center;">
  <h1>New page</h1>
  <p>Start writing your HTML here.</p>
</section>`,
  css: ``,
}

export const PAGE_TEMPLATES: PageTemplate[] = [landing, portfolio, comingSoon, blank]

export function getTemplate(key: string): PageTemplate {
  return PAGE_TEMPLATES.find(t => t.key === key) ?? blank
}

import { getSiteSettings } from "@/lib/site-settings"
import { SiteHeader } from "@/components/site/header"
import { SiteFooter } from "@/components/site/footer"

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings()

  const cssVars = `
    :root {
      --site-primary: ${settings.theme_primary};
      --site-secondary: ${settings.theme_secondary};
      --site-accent: ${settings.theme_accent};
      --site-bg: ${settings.theme_bg};
      --site-text: ${settings.theme_text};
    }
  `

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: cssVars }} />
      <div style={{ background: "var(--site-bg)", color: "var(--site-text)", minHeight: "100vh" }}>
        <SiteHeader settings={settings} />
        <main>{children}</main>
        <SiteFooter settings={settings} />
      </div>
    </>
  )
}

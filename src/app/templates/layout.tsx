import Link from "next/link"
import { Button } from "@/components/ui/button"

const NAV_LINKS = [
  { href: "/#services", label: "Features" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/templates", label: "Templates" },
  { href: "/#portfolio", label: "Examples" },
  { href: "/#about", label: "About" },
  { href: "/#contact", label: "Contact" },
]

export default function TemplatesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-border sticky top-0 z-50 bg-background/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center" data-testid="templates-logo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/site9-logo.png" alt="Site9 — One Website for Every Business" className="h-10 w-auto" />
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map(link => (
              <Link key={link.href} href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm"><Link href="/login">Sign in</Link></Button>
            <Button asChild variant="brand" size="sm"><Link href="/start">Get started</Link></Button>
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  )
}

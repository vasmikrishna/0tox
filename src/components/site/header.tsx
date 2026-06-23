"use client"
import { useState } from "react"
import Link from "next/link"
import { Menu, X, Phone } from "lucide-react"
import type { SiteSettings } from "@/lib/site-settings"

export function SiteHeader({ settings }: { settings: SiteSettings }) {
  const [open, setOpen] = useState(false)
  const phone = settings.contact_phone || ""
  const siteName = settings.site_name || "Site9"

  const navLinks = [
    { href: "/services", label: "Services" },
    { href: "/templates", label: "Templates" },
    { href: "/blog", label: "Blog" },
    { href: "/about", label: "About" },
    { href: "/work", label: "Our Work" },
    { href: "/contact", label: "Contact" },
  ]

  return (
    <header style={{ background: "var(--site-primary)", color: "#fff" }} className="sticky top-0 z-50 shadow-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-90" data-testid="site-logo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-mark.svg" alt="" aria-hidden="true" className="h-9 w-auto" />
            <span className="text-xl font-bold tracking-tight text-white">
              {siteName === "Site9" ? <>Site<span className="text-[#5C93FF]">9</span></> : siteName}
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map(l => (
              <Link key={l.href} href={l.href} className="text-sm font-medium text-white/85 hover:text-white transition-colors">
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Desktop right */}
          <div className="hidden md:flex items-center gap-4">
            {phone && (
              <a href={`tel:${phone.replace(/\s/g, "")}`} className="flex items-center gap-1.5 text-sm text-white/85 hover:text-white">
                <Phone className="h-3.5 w-3.5" />
                {phone}
              </a>
            )}
            <Link
              href="/contact"
              className="text-sm font-semibold rounded px-4 py-1.5 transition-colors hover:opacity-90"
              style={{ background: "var(--site-accent)", color: "#fff" }}
            >
              Get in touch
            </Link>
          </div>

          {/* Mobile menu button */}
          <button className="md:hidden text-white p-1" onClick={() => setOpen(!open)} aria-label="Toggle menu">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="md:hidden pb-4 border-t border-white/10 pt-3 space-y-1">
            {navLinks.map(l => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)}
                className="block px-2 py-2 text-sm text-white/85 hover:text-white">
                {l.label}
              </Link>
            ))}
            {phone && (
              <a href={`tel:${phone.replace(/\s/g, "")}`} className="flex items-center gap-2 px-2 py-2 text-sm text-white/85">
                <Phone className="h-3.5 w-3.5" /> {phone}
              </a>
            )}
            <div className="pt-2">
              <Link href="/contact" onClick={() => setOpen(false)}
                className="block text-center text-sm font-semibold rounded px-3 py-2 text-white"
                style={{ background: "var(--site-accent)" }}>
                Get in touch
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

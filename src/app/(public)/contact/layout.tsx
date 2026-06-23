import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch — we're here to help you get your business online.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Contact | Site9",
    description: "Get in touch — we're here to help you get your business online.",
  },
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children
}

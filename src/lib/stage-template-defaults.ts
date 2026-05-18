import type { DefaultServiceTier, ServiceTier, StageTemplate } from "@/types"

type DefaultStageTemplate = Omit<StageTemplate, "id"> & { id?: string }

export const DEFAULT_SERVICE_TIERS: DefaultServiceTier[] = ["starter", "standard", "pro"]

export const DEFAULT_STAGE_TEMPLATES: Record<DefaultServiceTier, DefaultStageTemplate[]> = {
  starter: [
    { service_tier: "starter", name: "Discovery & Intake", description: "Review requirements and finalise scope", sort_order: 1 },
    { service_tier: "starter", name: "Design Direction", description: "Create visual direction and key page structure", sort_order: 2 },
    { service_tier: "starter", name: "Page Build", description: "Develop the agreed website pages", sort_order: 3 },
    { service_tier: "starter", name: "QA & Review", description: "Test across devices and collect final feedback", sort_order: 4 },
    { service_tier: "starter", name: "Launch", description: "Deploy to production and hand off", sort_order: 5 },
  ],
  standard: [
    { service_tier: "standard", name: "Discovery & Intake", description: "Review requirements and finalise scope", sort_order: 1 },
    { service_tier: "standard", name: "Design System & Wireframes", description: "Brand direction, page wireframes, and component style", sort_order: 2 },
    { service_tier: "standard", name: "Core Pages Build", description: "Develop primary pages and responsive layouts", sort_order: 3 },
    { service_tier: "standard", name: "Inner Pages & Integrations", description: "Build secondary pages and connect third-party tools", sort_order: 4 },
    { service_tier: "standard", name: "CMS Setup", description: "Configure content management if required", sort_order: 5 },
    { service_tier: "standard", name: "QA & Review", description: "Cross-device testing, fixes, and review", sort_order: 6 },
    { service_tier: "standard", name: "SEO & Performance", description: "Optimise metadata, images, and speed", sort_order: 7 },
    { service_tier: "standard", name: "Launch", description: "Deploy and hand off", sort_order: 8 },
  ],
  pro: [
    { service_tier: "pro", name: "Discovery & Scoping", description: "Finalise feature list, user flows, and data model", sort_order: 1 },
    { service_tier: "pro", name: "Design System & UX", description: "UI design, component library, and user flows", sort_order: 2 },
    { service_tier: "pro", name: "Auth & Infrastructure", description: "Login, roles, database, and hosting setup", sort_order: 3 },
    { service_tier: "pro", name: "Core Feature Build", description: "Primary feature development", sort_order: 4 },
    { service_tier: "pro", name: "Dashboard & Portal", description: "User dashboard and management views", sort_order: 5 },
    { service_tier: "pro", name: "Integrations & Payments", description: "Third-party APIs and payment flows", sort_order: 6 },
    { service_tier: "pro", name: "QA & Security Review", description: "Full testing, security checks, and fixes", sort_order: 7 },
    { service_tier: "pro", name: "Launch & Handoff", description: "Deploy, document, and hand over credentials", sort_order: 8 },
  ],
}

export function defaultStageTemplatesFor(serviceTier: ServiceTier): StageTemplate[] {
  if (!DEFAULT_SERVICE_TIERS.includes(serviceTier as DefaultServiceTier)) return []

  return DEFAULT_STAGE_TEMPLATES[serviceTier as DefaultServiceTier].map((template, index) => ({
    id: `default-${serviceTier}-${index + 1}`,
    ...template,
  }))
}

import type { DefaultServiceTier, IntakeQuestion } from "@/types"

type DefaultQuestion = Omit<IntakeQuestion, "id" | "active"> & { id?: string }

export const DEFAULT_INTAKE_QUESTIONS: Record<DefaultServiceTier, DefaultQuestion[]> = {
  starter: [
    { service_tier: "starter", label: "Business name", type: "text", required: true, sort_order: 1 },
    { service_tier: "starter", label: "What does your business do? (1-2 sentences)", type: "textarea", required: true, sort_order: 2 },
    { service_tier: "starter", label: "Who is your target audience?", type: "textarea", required: true, sort_order: 3 },
    { service_tier: "starter", label: "Do you have a logo and brand colors?", type: "select", options: ["Yes, I have logo + colors", "I have a logo only", "I need branding help"], required: true, sort_order: 4 },
    { service_tier: "starter", label: "List the 5 pages you need", type: "textarea", required: true, sort_order: 5 },
    { service_tier: "starter", label: "Do you have copy ready, or do we write it?", type: "select", options: ["Copy is ready", "I need help writing it", "Mix of both"], required: true, sort_order: 6 },
    { service_tier: "starter", label: "Share 2-3 websites you like the style of", type: "textarea", required: false, sort_order: 7 },
    { service_tier: "starter", label: "Any specific features? (booking form, map, gallery, etc.)", type: "textarea", required: false, sort_order: 8 },
    { service_tier: "starter", label: "What is your target launch date?", type: "text", required: false, sort_order: 9 },
  ],
  standard: [
    { service_tier: "standard", label: "Business name", type: "text", required: true, sort_order: 1 },
    { service_tier: "standard", label: "What does your business do?", type: "textarea", required: true, sort_order: 2 },
    { service_tier: "standard", label: "Target audience", type: "textarea", required: true, sort_order: 3 },
    { service_tier: "standard", label: "Do you have branding assets?", type: "select", options: ["Yes, I have logo + colors", "I have a logo only", "I need branding help"], required: true, sort_order: 4 },
    { service_tier: "standard", label: "List all pages / sections needed", type: "textarea", required: true, sort_order: 5 },
    { service_tier: "standard", label: "Copy status", type: "select", options: ["Copy is ready", "I need help writing it", "Mix of both"], required: true, sort_order: 6 },
    { service_tier: "standard", label: "Reference sites you like", type: "textarea", required: false, sort_order: 7 },
    { service_tier: "standard", label: "Do you need a blog or CMS so you can update content yourself?", type: "select", options: ["Yes, I want a CMS", "No, static is fine", "Not sure"], required: true, sort_order: 8 },
    { service_tier: "standard", label: "Any integrations needed? (booking, payments, maps, live chat, etc.)", type: "textarea", required: false, sort_order: 9 },
    { service_tier: "standard", label: "Any animations or interactive elements you envision?", type: "textarea", required: false, sort_order: 10 },
    { service_tier: "standard", label: "Target launch date", type: "text", required: false, sort_order: 11 },
  ],
  pro: [
    { service_tier: "pro", label: "Product / app name", type: "text", required: true, sort_order: 1 },
    { service_tier: "pro", label: "What problem does this product solve?", type: "textarea", required: true, sort_order: 2 },
    { service_tier: "pro", label: "Who are the users?", type: "textarea", required: true, sort_order: 3 },
    { service_tier: "pro", label: "What are the top 5 features for v1?", type: "textarea", required: true, sort_order: 4 },
    { service_tier: "pro", label: "What user roles are needed?", type: "select", options: ["Just one (user)", "Two (user + admin)", "Multiple custom roles"], required: true, sort_order: 5 },
    { service_tier: "pro", label: "What login methods do you want?", type: "select", options: ["Email + password", "Google login", "Both"], required: true, sort_order: 6 },
    { service_tier: "pro", label: "Describe the main data (what does a user own or create)?", type: "textarea", required: true, sort_order: 7 },
    { service_tier: "pro", label: "Do you need payments inside the app?", type: "select", options: ["Yes, payments inside the app", "No", "Not sure yet"], required: true, sort_order: 8 },
    { service_tier: "pro", label: "Any third-party integrations? (APIs, tools, services)", type: "textarea", required: false, sort_order: 9 },
    { service_tier: "pro", label: "Do you have wireframes, mockups, or design references?", type: "file", required: false, sort_order: 10 },
    { service_tier: "pro", label: "Target launch date", type: "text", required: false, sort_order: 11 },
  ],
}

"use client"
import { useState, useEffect } from "react"
import { Save, RefreshCw, Eye, Palette, FileText } from "lucide-react"

type Settings = Record<string, string>

const THEME_FIELDS = [
  { key: "theme_primary", label: "Primary colour", type: "color", hint: "Used in header, footer, headings" },
  { key: "theme_accent", label: "Accent colour", type: "color", hint: "Used in buttons, icons, highlights" },
  { key: "theme_bg", label: "Background colour", type: "color", hint: "Page background" },
  { key: "theme_text", label: "Body text colour", type: "color", hint: "Default text colour" },
]

const THEME_PRESETS = [
  { name: "Aussie Navy", primary: "#1B3A6B", accent: "#16A34A", bg: "#f8f9fa", text: "#1a1a2e" },
  { name: "Outback Red", primary: "#7C2D12", accent: "#F59E0B", bg: "#FFFBF5", text: "#1A1A1A" },
  { name: "Coastal Teal", primary: "#0F766E", accent: "#F97316", bg: "#F0FDFA", text: "#134E4A" },
  { name: "Charcoal Pro", primary: "#1F2937", accent: "#3B82F6", bg: "#F9FAFB", text: "#111827" },
  { name: "Forest Green", primary: "#14532D", accent: "#FBBF24", bg: "#F7FEF8", text: "#1A2F1A" },
  { name: "Midnight Blue", primary: "#0F172A", accent: "#22D3EE", bg: "#F8FAFC", text: "#0F172A" },
  { name: "Ocean Breeze", primary: "#0369A1", accent: "#10B981", bg: "#F0F9FF", text: "#0C4A6E" },
  { name: "Royal Purple", primary: "#581C87", accent: "#EC4899", bg: "#FAF5FF", text: "#3B0764" },
  { name: "Earthy Brown", primary: "#5B3A1A", accent: "#D97706", bg: "#FEF9F0", text: "#2C1A0A" },
  { name: "Slate Modern", primary: "#334155", accent: "#06B6D4", bg: "#F8FAFC", text: "#0F172A" },
  { name: "Burgundy Pro", primary: "#7F1D1D", accent: "#D4A017", bg: "#FEFAF6", text: "#171717" },
  { name: "Indigo Sky", primary: "#3730A3", accent: "#FB7185", bg: "#F5F3FF", text: "#1E1B4B" },
  { name: "Desert Sand", primary: "#92400E", accent: "#0E7490", bg: "#FFFBEB", text: "#451A03" },
  { name: "Pure Mono", primary: "#000000", accent: "#FACC15", bg: "#FFFFFF", text: "#000000" },
  { name: "Soft Pink Tech", primary: "#9D174D", accent: "#0EA5E9", bg: "#FFF7F8", text: "#3F0D1F" },
]

const CONTENT_SECTIONS = [
  {
    label: "General",
    fields: [
      { key: "site_name", label: "Business name", type: "text" },
      { key: "site_tagline", label: "Site tagline", type: "text" },
      { key: "footer_tagline", label: "Footer tagline", type: "text" },
    ],
  },
  {
    label: "Hero",
    fields: [
      { key: "hero_headline", label: "Headline", type: "text" },
      { key: "hero_sub", label: "Sub-heading", type: "textarea" },
      { key: "hero_cta_primary", label: "Primary button text", type: "text" },
      { key: "hero_cta_secondary", label: "Secondary button text", type: "text" },
    ],
  },
  {
    label: "Contact",
    fields: [
      { key: "contact_phone", label: "Phone number", type: "text" },
      { key: "contact_email", label: "Email address", type: "text" },
      { key: "contact_address", label: "Address / location", type: "text" },
      { key: "contact_linkedin", label: "LinkedIn URL", type: "text" },
    ],
  },
  {
    label: "About",
    fields: [
      { key: "about_heading", label: "Section heading", type: "text" },
      { key: "about_intro", label: "Intro paragraph", type: "textarea" },
      { key: "about_stat_1_num", label: "Stat 1 — number", type: "text" },
      { key: "about_stat_1_label", label: "Stat 1 — label", type: "text" },
      { key: "about_stat_2_num", label: "Stat 2 — number", type: "text" },
      { key: "about_stat_2_label", label: "Stat 2 — label", type: "text" },
      { key: "about_stat_3_num", label: "Stat 3 — number", type: "text" },
      { key: "about_stat_3_label", label: "Stat 3 — label", type: "text" },
      { key: "about_stat_4_num", label: "Stat 4 — number", type: "text" },
      { key: "about_stat_4_label", label: "Stat 4 — label", type: "text" },
    ],
  },
  {
    label: "IT Support Service",
    fields: [
      { key: "services_it_title", label: "Title", type: "text" },
      { key: "services_it_tagline", label: "Tagline", type: "text" },
      { key: "services_it_desc", label: "Description", type: "textarea" },
      { key: "services_it_features", label: "Features (pipe-separated |)", type: "textarea" },
    ],
  },
  {
    label: "Web Services",
    fields: [
      { key: "services_web_title", label: "Title", type: "text" },
      { key: "services_web_tagline", label: "Tagline", type: "text" },
      { key: "services_web_desc", label: "Description", type: "textarea" },
      { key: "services_web_features", label: "Features (pipe-separated |)", type: "textarea" },
    ],
  },
  {
    label: "Microsoft 365",
    fields: [
      { key: "services_ms365_title", label: "Title", type: "text" },
      { key: "services_ms365_tagline", label: "Tagline", type: "text" },
      { key: "services_ms365_desc", label: "Description", type: "textarea" },
      { key: "services_ms365_features", label: "Features (pipe-separated |)", type: "textarea" },
    ],
  },
  {
    label: "Team",
    fields: [
      { key: "team_heading", label: "Section heading", type: "text" },
      { key: "team_sub", label: "Section sub-heading", type: "text" },
      { key: "team_1_name", label: "Member 1 — name", type: "text" },
      { key: "team_1_role", label: "Member 1 — role", type: "text" },
      { key: "team_1_bio", label: "Member 1 — bio", type: "textarea" },
      { key: "team_1_photo", label: "Member 1 — photo URL", type: "text" },
      { key: "team_1_linkedin", label: "Member 1 — LinkedIn URL", type: "text" },
      { key: "team_2_name", label: "Member 2 — name", type: "text" },
      { key: "team_2_role", label: "Member 2 — role", type: "text" },
      { key: "team_2_bio", label: "Member 2 — bio", type: "textarea" },
      { key: "team_2_photo", label: "Member 2 — photo URL", type: "text" },
      { key: "team_2_linkedin", label: "Member 2 — LinkedIn URL", type: "text" },
      { key: "team_3_name", label: "Member 3 — name", type: "text" },
      { key: "team_3_role", label: "Member 3 — role", type: "text" },
      { key: "team_3_bio", label: "Member 3 — bio", type: "textarea" },
      { key: "team_3_photo", label: "Member 3 — photo URL", type: "text" },
      { key: "team_3_linkedin", label: "Member 3 — LinkedIn URL", type: "text" },
      { key: "team_4_name", label: "Member 4 — name", type: "text" },
      { key: "team_4_role", label: "Member 4 — role", type: "text" },
      { key: "team_4_bio", label: "Member 4 — bio", type: "textarea" },
      { key: "team_4_photo", label: "Member 4 — photo URL", type: "text" },
      { key: "team_4_linkedin", label: "Member 4 — LinkedIn URL", type: "text" },
    ],
  },
  {
    label: "Testimonials",
    fields: [
      { key: "testimonial_1_name", label: "Testimonial 1 — name", type: "text" },
      { key: "testimonial_1_role", label: "Testimonial 1 — role", type: "text" },
      { key: "testimonial_1_text", label: "Testimonial 1 — quote", type: "textarea" },
      { key: "testimonial_2_name", label: "Testimonial 2 — name", type: "text" },
      { key: "testimonial_2_role", label: "Testimonial 2 — role", type: "text" },
      { key: "testimonial_2_text", label: "Testimonial 2 — quote", type: "textarea" },
      { key: "testimonial_3_name", label: "Testimonial 3 — name", type: "text" },
      { key: "testimonial_3_role", label: "Testimonial 3 — role", type: "text" },
      { key: "testimonial_3_text", label: "Testimonial 3 — quote", type: "textarea" },
    ],
  },
  {
    label: "V1 (Classic site)",
    fields: [
      { key: "v1_active", label: "Show 'Classic site' link in footer", type: "select", options: [{ value: "true", label: "Yes" }, { value: "false", label: "No" }] },
    ],
  },
]

export default function WebsiteEditorPage() {
  const [settings, setSettings] = useState<Settings>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState<"theme" | "content">("theme")
  const [activeSection, setActiveSection] = useState(0)

  useEffect(() => {
    fetch("/api/admin/website")
      .then(r => r.json())
      .then(d => { setSettings(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  function set(key: string, value: string) {
    setSettings(prev => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  async function handleSave() {
    setSaving(true)
    try {
      await fetch("/api/admin/website", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <RefreshCw className="h-5 w-5 animate-spin mr-2" /> Loading settings…
      </div>
    )
  }

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Website Editor</h1>
          <p className="text-muted-foreground text-sm mt-1">Edit your public website content and theme colours.</p>
        </div>
        <div className="flex items-center gap-3">
          <a href="/" target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground border border-border rounded px-3 py-1.5">
            <Eye className="h-3.5 w-3.5" /> Preview site
          </a>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            style={{ background: saved ? "#16A34A" : "var(--site-accent, #16A34A)" }}
          >
            <Save className="h-3.5 w-3.5" />
            {saving ? "Saving…" : saved ? "Saved ✓" : "Save changes"}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border mb-6">
        <TabButton active={activeTab === "theme"} onClick={() => setActiveTab("theme")} icon={<Palette className="h-4 w-4" />} label="Theme & Colours" />
        <TabButton active={activeTab === "content"} onClick={() => setActiveTab("content")} icon={<FileText className="h-4 w-4" />} label="Content" />
      </div>

      {/* Theme tab */}
      {activeTab === "theme" && (
        <div className="space-y-6">
          {/* Presets */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold">Quick themes</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Click any preset to apply instantly. Customise below if needed.</p>
              </div>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
              {THEME_PRESETS.map(preset => {
                const isActive =
                  settings.theme_primary === preset.primary &&
                  settings.theme_accent === preset.accent
                return (
                  <button
                    key={preset.name}
                    onClick={() => {
                      setSettings(prev => ({
                        ...prev,
                        theme_primary: preset.primary,
                        theme_accent: preset.accent,
                        theme_bg: preset.bg,
                        theme_text: preset.text,
                      }))
                      setSaved(false)
                    }}
                    className={`group rounded-lg border-2 p-2 text-left transition-all hover:shadow-md ${
                      isActive ? "border-foreground" : "border-border hover:border-foreground/30"
                    }`}
                  >
                    <div className="rounded overflow-hidden flex h-8">
                      <div className="flex-1" style={{ background: preset.primary }} />
                      <div className="flex-1" style={{ background: preset.accent }} />
                      <div className="flex-1" style={{ background: preset.bg }} />
                    </div>
                    <p className="text-xs font-medium mt-1.5 truncate">{preset.name}</p>
                    {isActive && <p className="text-[10px] text-muted-foreground">Active ✓</p>}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="font-semibold mb-4">Custom palette</h2>
            <div className="grid grid-cols-2 gap-6">
              {THEME_FIELDS.map(f => (
                <div key={f.key}>
                  <label className="block text-sm font-medium mb-1">{f.label}</label>
                  <p className="text-xs text-muted-foreground mb-2">{f.hint}</p>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={settings[f.key] ?? "#000000"}
                      onChange={e => set(f.key, e.target.value)}
                      className="h-10 w-16 rounded border border-border cursor-pointer"
                    />
                    <input
                      type="text"
                      value={settings[f.key] ?? ""}
                      onChange={e => set(f.key, e.target.value)}
                      placeholder="#1B3A6B"
                      className="flex-1 rounded border border-input bg-background px-3 py-2 text-sm font-mono"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Preview swatch */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="font-semibold mb-4">Preview</h2>
            <div className="rounded-lg overflow-hidden border border-border">
              <div className="p-4 text-white text-sm font-semibold" style={{ background: settings.theme_primary ?? "#1B3A6B" }}>
                Header — {settings.site_name ?? "Site name"}
              </div>
              <div className="p-4 text-sm" style={{ background: settings.theme_bg ?? "#f8f9fa", color: settings.theme_text ?? "#1a1a2e" }}>
                Body text example — <span className="font-semibold">bold text</span>
              </div>
              <div className="p-3 flex gap-2">
                <span className="rounded px-3 py-1 text-xs text-white font-semibold" style={{ background: settings.theme_accent ?? "#16A34A" }}>
                  Accent button
                </span>
                <span className="rounded px-3 py-1 text-xs text-white font-semibold" style={{ background: settings.theme_primary ?? "#1B3A6B" }}>
                  Primary button
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content tab */}
      {activeTab === "content" && (
        <div className="grid grid-cols-4 gap-6">
          {/* Section nav */}
          <div className="col-span-1">
            <nav className="space-y-1">
              {CONTENT_SECTIONS.map((sec, i) => (
                <button
                  key={i}
                  onClick={() => setActiveSection(i)}
                  className={`w-full text-left text-sm px-3 py-2 rounded transition-colors ${
                    activeSection === i
                      ? "bg-foreground text-background font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                >
                  {sec.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Fields */}
          <div className="col-span-3 bg-card border border-border rounded-lg p-6 space-y-5">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
              {CONTENT_SECTIONS[activeSection].label}
            </h2>
            {CONTENT_SECTIONS[activeSection].fields.map(f => (
              <div key={f.key}>
                <label className="block text-sm font-medium mb-1.5">{f.label}</label>
                {f.type === "textarea" ? (
                  <textarea
                    value={settings[f.key] ?? ""}
                    onChange={e => set(f.key, e.target.value)}
                    rows={3}
                    className="w-full rounded border border-input bg-background px-3 py-2 text-sm resize-y"
                  />
                ) : f.type === "select" ? (
                  <select
                    value={settings[f.key] ?? ""}
                    onChange={e => set(f.key, e.target.value)}
                    className="rounded border border-input bg-background px-3 py-2 text-sm"
                  >
                    {(f as any).options?.map((o: any) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={settings[f.key] ?? ""}
                    onChange={e => set(f.key, e.target.value)}
                    className="w-full rounded border border-input bg-background px-3 py-2 text-sm"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
        active ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
      }`}
    >
      {icon} {label}
    </button>
  )
}

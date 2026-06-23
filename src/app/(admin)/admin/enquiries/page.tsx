"use client"
import { useState, useEffect, useCallback } from "react"
import { Mail, Phone, Trash2, Reply, Archive, Inbox, Clock, Check, Search, RefreshCw } from "lucide-react"

type Enquiry = {
  id: string
  name: string
  email: string
  phone: string | null
  service: string | null
  message: string
  status: "new" | "read" | "replied" | "archived"
  source: string | null
  admin_note: string | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
  updated_at: string
  tenants?: { name: string; slug: string } | null
}

type Counts = { new: number; read: number; replied: number; archived: number; all: number }

const SERVICE_LABELS: Record<string, string> = {
  it: "IT Support & Infrastructure",
  web: "Web Services",
  ms365: "Microsoft 365",
  other: "Not sure / Other",
}

const STATUS_TABS: { key: keyof Counts; label: string; icon: any }[] = [
  { key: "all", label: "All", icon: Mail },
  { key: "new", label: "New", icon: Inbox },
  { key: "read", label: "Read", icon: Clock },
  { key: "replied", label: "Replied", icon: Check },
  { key: "archived", label: "Archived", icon: Archive },
]

export default function EnquiriesPage() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([])
  const [counts, setCounts] = useState<Counts>({ new: 0, read: 0, replied: 0, archived: 0, all: 0 })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<keyof Counts>("all")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  
  const [replying, setReplying] = useState(false)
  const [replyMessage, setReplyMessage] = useState("")
  const [sendingReply, setSendingReply] = useState(false)

  const load = useCallback(async (tab: keyof Counts = activeTab) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/enquiries?status=${tab}`)
      const data = await res.json()
      setEnquiries(data.enquiries ?? [])
      setCounts(data.counts ?? { new: 0, read: 0, replied: 0, archived: 0, all: 0 })
    } finally {
      setLoading(false)
    }
  }, [activeTab])

  useEffect(() => { load(activeTab) }, [activeTab, load])

  useEffect(() => {
    setReplying(false)
    setReplyMessage("")
  }, [selectedId])

  async function updateStatus(id: string, status: Enquiry["status"]) {
    await fetch(`/api/admin/enquiries/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    await load()
  }

  async function remove(id: string) {
    if (!confirm("Delete this enquiry permanently? This cannot be undone.")) return
    await fetch(`/api/admin/enquiries/${id}`, { method: "DELETE" })
    setSelectedId(null)
    await load()
  }

  async function submitReply() {
    if (!selectedId || !replyMessage.trim()) return
    setSendingReply(true)
    try {
      const res = await fetch(`/api/admin/enquiries/${selectedId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ replyMessage }),
      })
      if (!res.ok) {
        const errData = await res.json()
        alert(errData.error || "Failed to send reply")
        return
      }
      setReplying(false)
      setReplyMessage("")
      await load()
    } catch (err) {
      alert("Error sending reply")
    } finally {
      setSendingReply(false)
    }
  }

  const filtered = search.trim()
    ? enquiries.filter(e =>
        [e.name, e.email, e.message, e.phone, e.service]
          .filter(Boolean)
          .some(f => f!.toLowerCase().includes(search.toLowerCase()))
      )
    : enquiries

  const selected = enquiries.find(e => e.id === selectedId)

  // When an enquiry is selected and is "new", auto-mark as read
  useEffect(() => {
    if (selected && selected.status === "new") {
      updateStatus(selected.id, "read")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId])

  return (
    <div className="max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Enquiries</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Messages from your website visitors and contact forms.
          </p>
        </div>
        <button
          onClick={() => load()}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground border border-border rounded px-3 py-1.5"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border mb-4">
        {STATUS_TABS.map(t => {
          const Icon = t.icon
          const count = counts[t.key]
          const active = activeTab === t.key
          return (
            <button
              key={t.key}
              onClick={() => { setActiveTab(t.key); setSelectedId(null) }}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                active ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
              {count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  t.key === "new" && count > 0
                    ? "bg-red-500 text-white"
                    : active
                      ? "bg-foreground text-background"
                      : "bg-accent text-foreground"
                }`}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, email, message…"
          className="w-full pl-10 pr-3 py-2 text-sm rounded border border-input bg-background focus:outline-none focus:ring-2 focus:ring-foreground/20"
        />
      </div>

      {/* Split view */}
      <div className="grid lg:grid-cols-[380px_1fr] gap-4">
        {/* List */}
        <div className="border border-border rounded-lg overflow-hidden bg-card">
          {loading && enquiries.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground text-sm">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground">
              <Inbox className="h-8 w-8 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">No enquiries</p>
              <p className="text-xs mt-1">
                {search ? "No results match your search." : "When customers submit the contact form, they'll appear here."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border max-h-[calc(100vh-280px)] overflow-y-auto">
              {filtered.map(e => (
                <button
                  key={e.id}
                  onClick={() => setSelectedId(e.id)}
                  className={`w-full text-left p-4 transition-colors block ${
                    selectedId === e.id
                      ? "bg-accent"
                      : "hover:bg-accent/50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className={`text-sm truncate ${e.status === "new" ? "font-bold" : "font-medium"}`}>
                      {e.name}
                    </p>
                    {e.status === "new" && (
                      <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0 mt-1.5" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{e.email}</p>
                  {e.tenants?.name && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">{e.tenants.name}</p>
                  )}
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1.5">
                    {e.message}
                  </p>
                  <div className="flex items-center justify-between mt-2 text-[11px] text-muted-foreground">
                    <span>{formatRelative(e.created_at)}</span>
                    <div className="flex items-center gap-1.5">
                      {e.source === "website_form" && (
                        <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 text-[10px]">
                          Website
                        </span>
                      )}
                      {e.service && (
                        <span className="px-1.5 py-0.5 rounded bg-accent text-foreground text-[10px]">
                          {SERVICE_LABELS[e.service]?.split(" ")[0] ?? e.service}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Detail panel */}
        <div className="border border-border rounded-lg bg-card overflow-hidden">
          {!selected ? (
            <div className="p-16 text-center text-muted-foreground">
              <Mail className="h-10 w-10 mx-auto mb-4 opacity-30" />
              <p className="font-medium">Select an enquiry to view it</p>
              <p className="text-xs mt-1">Choose a message from the list on the left.</p>
            </div>
          ) : (
            <div className="flex flex-col h-full max-h-[calc(100vh-280px)]">
              {/* Header */}
              <div className="p-5 border-b border-border">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-bold">{selected.name}</h2>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm">
                      <a href={`mailto:${selected.email}`} className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5" /> {selected.email}
                      </a>
                      {selected.phone && (
                        <a href={`tel:${selected.phone}`} className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5" /> {selected.phone}
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {selected.tenants?.name && (
                      <span className="text-xs px-2 py-1 rounded-full font-medium bg-purple-100 text-purple-700">
                        {selected.tenants.name}
                      </span>
                    )}
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusBadge(selected.status)}`}>
                      {selected.status}
                    </span>
                  </div>
                </div>

                {/* Action bar */}
                <div className="flex flex-wrap items-center gap-2 mt-4">
                  <button
                    onClick={() => setReplying(true)}
                    className="inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90"
                    style={{ background: "var(--site-accent, #16A34A)" }}
                  >
                    <Reply className="h-3 w-3" /> Reply directly
                  </button>
                  <a
                    href={`mailto:${selected.email}?subject=Re: Your enquiry`}
                    onClick={() => updateStatus(selected.id, "replied")}
                    className="inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium border border-border hover:bg-accent"
                  >
                    Open in Mail client
                  </a>
                  {selected.status !== "replied" && (
                    <button
                      onClick={() => updateStatus(selected.id, "replied")}
                      className="inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium border border-border hover:bg-accent"
                    >
                      <Check className="h-3 w-3" /> Mark replied
                    </button>
                  )}
                  {selected.status !== "archived" ? (
                    <button
                      onClick={() => updateStatus(selected.id, "archived")}
                      className="inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium border border-border hover:bg-accent"
                    >
                      <Archive className="h-3 w-3" /> Archive
                    </button>
                  ) : (
                    <button
                      onClick={() => updateStatus(selected.id, "read")}
                      className="inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium border border-border hover:bg-accent"
                    >
                      Unarchive
                    </button>
                  )}
                  <button
                    onClick={() => remove(selected.id)}
                    className="inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 ml-auto"
                  >
                    <Trash2 className="h-3 w-3" /> Delete
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="p-5 flex-1 overflow-y-auto space-y-5">
                {replying && (
                  <div className="border border-border rounded-lg bg-muted/20 p-4 space-y-3">
                    <p className="text-xs font-medium text-muted-foreground">Drafting reply to {selected.email}:</p>
                    <textarea
                      value={replyMessage}
                      onChange={e => setReplyMessage(e.target.value)}
                      disabled={sendingReply}
                      placeholder="Write your email reply here..."
                      className="w-full min-h-[140px] p-3 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-foreground/20"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={submitReply}
                        disabled={sendingReply || !replyMessage.trim()}
                        className="inline-flex items-center justify-center gap-1.5 rounded px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                        style={{ background: "var(--site-accent, #16A34A)" }}
                      >
                        {sendingReply ? "Sending..." : "Send Reply"}
                      </button>
                      <button
                        onClick={() => { setReplying(false); setReplyMessage("") }}
                        disabled={sendingReply}
                        className="inline-flex items-center justify-center rounded border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {selected.admin_note && (
                  <Field label="Admin Notes & Reply History">
                    <div className="whitespace-pre-wrap leading-relaxed text-sm bg-muted/40 p-3 border border-border rounded-lg text-muted-foreground">
                      {selected.admin_note}
                    </div>
                  </Field>
                )}

                <Field label="Source">
                  <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full font-medium ${
                    selected.source === "website_form" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"
                  }`}>
                    {selected.source === "website_form" ? "Website Form" : selected.source === "contact_page" ? "Contact Page" : "Contact Form"}
                  </span>
                </Field>

                <Field label="Service interested in">
                  {selected.service ? SERVICE_LABELS[selected.service] ?? selected.service : <span className="text-muted-foreground italic">Not specified</span>}
                </Field>

                <Field label="Message">
                  <p className="whitespace-pre-wrap leading-relaxed text-sm">{selected.message}</p>
                </Field>

                <Field label="Submitted">
                  <p className="text-sm text-muted-foreground">
                    {new Date(selected.created_at).toLocaleString("en-AU", {
                      dateStyle: "full",
                      timeStyle: "short",
                    })}
                  </p>
                </Field>

                <details className="text-xs text-muted-foreground">
                  <summary className="cursor-pointer font-medium hover:text-foreground">
                    Technical details
                  </summary>
                  <dl className="grid grid-cols-[80px_1fr] gap-x-3 gap-y-1 mt-2 font-mono">
                    <dt>IP</dt><dd className="break-all">{selected.ip_address ?? "—"}</dd>
                    <dt>UA</dt><dd className="break-all">{selected.user_agent ?? "—"}</dd>
                    <dt>ID</dt><dd className="break-all">{selected.id}</dd>
                  </dl>
                </details>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">{label}</p>
      <div className="text-sm">{children}</div>
    </div>
  )
}

function statusBadge(status: string) {
  switch (status) {
    case "new": return "bg-red-100 text-red-700"
    case "read": return "bg-blue-100 text-blue-700"
    case "replied": return "bg-green-100 text-green-700"
    case "archived": return "bg-gray-100 text-gray-600"
    default: return "bg-gray-100 text-gray-600"
  }
}

function formatRelative(iso: string) {
  const now = Date.now()
  const then = new Date(iso).getTime()
  const diff = Math.floor((now - then) / 1000)
  if (diff < 60) return "just now"
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return new Date(iso).toLocaleDateString("en-AU", { day: "numeric", month: "short" })
}

"use client"

import { useState, useEffect } from "react"
import { Globe, CheckCircle2, XCircle, RefreshCw, Trash2, ExternalLink, Copy, Check } from "lucide-react"

interface DomainData {
  slug: string
  subdomain: string
  custom_domain: string | null
  domain_verified: boolean
  baseDomain: string
}

interface DomainChallenge {
  type: string
  domain: string
  value: string
}

// Derive the DNS record Name from the custom domain.
// Root domain (mybusiness.com) → "@"; subdomain (app.mybusiness.com) → "app".
// Note: assumes a two-label registrable root (.com, .in); multi-part TLDs
// like .co.uk would need a public-suffix list for full correctness.
function dnsRecordName(host: string): string {
  const labels = host.split(".")
  return labels.length > 2 ? labels.slice(0, -2).join(".") : "@"
}

export default function DomainSettingsPage() {
  const [data, setData] = useState<DomainData | null>(null)
  const [loading, setLoading] = useState(true)
  const [domain, setDomain] = useState("")
  const [saving, setSaving] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [copied, setCopied] = useState(false)
  const [challenges, setChallenges] = useState<DomainChallenge[]>([])

  async function load() {
    setLoading(true)
    const res = await fetch("/api/admin/domain")
    const d = await res.json()
    setData(d)
    setDomain(d.custom_domain ?? "")
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleSave() {
    setSaving(true)
    setError("")
    setSuccess("")
    const res = await fetch("/api/admin/domain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "set", domain }),
    })
    const d = await res.json()
    setSaving(false)
    if (!res.ok) { setError(d.error); return }
    setSuccess("Domain saved. Now add the DNS record and verify.")
    await load()
  }

  async function handleVerify() {
    setVerifying(true)
    setError("")
    setSuccess("")
    const res = await fetch("/api/admin/domain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "verify" }),
    })
    const d = await res.json()
    setVerifying(false)
    setChallenges(d.challenges ?? [])
    if (d.verified) {
      setSuccess("Domain verified! Your site is now live on " + d.domain)
    } else if (d.challenges?.length) {
      setError("Almost there — add the ownership record(s) below, then verify again.")
    } else {
      setError("DNS not configured yet. Make sure you added the CNAME record and wait a few minutes for it to propagate.")
    }
    await load()
  }

  async function handleRemove() {
    if (!confirm("Remove your custom domain? Your site will only be available on the subdomain.")) return
    setRemoving(true)
    setError("")
    await fetch("/api/admin/domain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "remove" }),
    })
    setRemoving(false)
    setDomain("")
    setSuccess("Custom domain removed.")
    await load()
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading || !data) {
    return <div className="p-8 text-muted-foreground text-sm">Loading...</div>
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Domain Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your website&apos;s domain and subdomain.
        </p>
      </div>

      {/* Current subdomain */}
      <div className="rounded-lg border border-border p-5 space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Globe className="h-4 w-4" />
          Your Subdomain
        </div>
        <div className="flex items-center gap-3">
          <code className="flex-1 bg-muted px-3 py-2 rounded text-sm font-mono">
            {data.subdomain}
          </code>
          <a
            href={`https://${data.subdomain}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
        <p className="text-xs text-muted-foreground">
          This is your free subdomain. It&apos;s always active.
        </p>
      </div>

      {/* Custom domain */}
      <div className="rounded-lg border border-border p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Globe className="h-4 w-4" />
            Custom Domain
          </div>
          {data.custom_domain && data.domain_verified && (
            <span className="inline-flex items-center gap-1.5 text-xs text-green-600 font-medium">
              <CheckCircle2 className="h-3.5 w-3.5" /> Verified
            </span>
          )}
          {data.custom_domain && !data.domain_verified && (
            <span className="inline-flex items-center gap-1.5 text-xs text-amber-600 font-medium">
              <XCircle className="h-3.5 w-3.5" /> Pending verification
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <input
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="www.mybusiness.com"
            className="flex-1 px-3 py-2 rounded border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
            data-testid="custom-domain-input"
          />
          <button
            onClick={handleSave}
            disabled={saving || !domain.trim() || domain === data.custom_domain}
            className="px-4 py-2 rounded bg-foreground text-background text-sm font-medium disabled:opacity-50"
            data-testid="save-domain-btn"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
        {success && <p className="text-sm text-green-600">{success}</p>}

        {/* DNS instructions */}
        {data.custom_domain && (
          <div className="rounded-lg bg-muted/50 p-4 space-y-3">
            <p className="text-sm font-semibold">DNS Configuration</p>
            <p className="text-xs text-muted-foreground">
              Add this CNAME record in your domain provider&apos;s DNS settings:
            </p>
            <div className="rounded border border-border bg-background overflow-x-auto">
              <table className="w-full min-w-[24rem] text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground">Type</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground">Name</th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground">Value</th>
                    <th className="w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-3 py-2 font-mono text-xs">CNAME</td>
                    <td className="px-3 py-2 font-mono text-xs">
                      {dnsRecordName(data.custom_domain)}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs">{data.subdomain}</td>
                    <td className="px-2 py-2">
                      <button
                        onClick={() => copyToClipboard(data.subdomain)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {challenges.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-amber-600">
                  Ownership verification required — add these record(s) too:
                </p>
                <div className="rounded border border-amber-500/40 bg-background overflow-x-auto">
                  <table className="w-full min-w-[24rem] text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground">Type</th>
                        <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground">Name</th>
                        <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground">Value</th>
                        <th className="w-8"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {challenges.map((c, i) => (
                        <tr key={i} className="border-t border-border/50">
                          <td className="px-3 py-2 font-mono text-xs">{c.type}</td>
                          <td className="px-3 py-2 font-mono text-xs break-all">{c.domain}</td>
                          <td className="px-3 py-2 font-mono text-xs break-all">{c.value}</td>
                          <td className="px-2 py-2">
                            <button
                              onClick={() => copyToClipboard(c.value)}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  This proves you own the domain. Some providers want only the sub-part of the
                  Name (e.g. <code className="font-mono">_vercel</code>) — they append the rest automatically.
                </p>
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                onClick={handleVerify}
                disabled={verifying}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-foreground text-background disabled:opacity-50"
                data-testid="verify-domain-btn"
              >
                <RefreshCw className={`h-3 w-3 ${verifying ? "animate-spin" : ""}`} />
                {verifying ? "Checking..." : "Verify DNS"}
              </button>
              <button
                onClick={handleRemove}
                disabled={removing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium text-red-600 hover:bg-red-50 border border-border"
                data-testid="remove-domain-btn"
              >
                <Trash2 className="h-3 w-3" />
                Remove
              </button>
            </div>

            <p className="text-[11px] text-muted-foreground">
              DNS changes can take up to 24 hours to propagate, but usually take just a few minutes.
            </p>
          </div>
        )}

        {!data.custom_domain && (
          <p className="text-xs text-muted-foreground">
            Connect your own domain (e.g., www.mybusiness.com) so customers find you at your brand&apos;s address.
          </p>
        )}
      </div>
    </div>
  )
}

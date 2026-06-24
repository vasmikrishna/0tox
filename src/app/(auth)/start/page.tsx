"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Check, X, Loader2, ArrowRight, ArrowLeft, Eye, EyeOff } from "lucide-react"
import { slugify, validateSlug, BASE_DOMAIN } from "@/lib/onboarding"

type Availability =
  | { state: "idle" }
  | { state: "checking" }
  | { state: "available"; host: string }
  | { state: "taken"; reason: string }

export default function StartPage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(1)

  // Step 1 — business name + subdomain
  const [businessName, setBusinessName] = useState("")
  const [slug, setSlug] = useState("")
  const [slugEdited, setSlugEdited] = useState(false)
  const [avail, setAvail] = useState<Availability>({ state: "idle" })

  // Step 2 — account
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  // Apply a new slug and reset its status; the network check runs debounced below.
  function applySlug(value: string) {
    setSlug(value)
    if (!value) setAvail({ state: "idle" })
  }

  function onBusinessName(value: string) {
    setBusinessName(value)
    if (!slugEdited) applySlug(slugify(value))
  }

  const checkSlug = useCallback((value: string) => {
    const format = validateSlug(value)
    if (!format.valid) {
      setAvail(value ? { state: "taken", reason: format.reason } : { state: "idle" })
      return
    }
    setAvail({ state: "checking" })
    fetch(`/api/onboarding/check-subdomain?slug=${encodeURIComponent(value)}`)
      .then(r => r.json())
      .then(data => {
        if (data.available) setAvail({ state: "available", host: data.host })
        else setAvail({ state: "taken", reason: data.reason ?? "Not available" })
      })
      .catch(() => setAvail({ state: "taken", reason: "Could not check availability" }))
  }, [])

  // Debounced availability check whenever the slug changes.
  useEffect(() => {
    if (!slug) return
    const id = setTimeout(() => checkSlug(slug), 400)
    return () => clearTimeout(id)
  }, [slug, checkSlug])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    const res = await fetch("/api/onboarding/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessName, slug, name, email, password }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      setError(data.error ?? "Something went wrong")
      setLoading(false)
      // A taken slug means we have to go back and pick another.
      if (res.status === 409) { setStep(1); setAvail({ state: "taken", reason: data.error }) }
      return
    }
    router.push("/build")
    router.refresh()
  }

  const canContinue = avail.state === "available" && businessName.trim().length > 0

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <Link href="/" className="text-2xl font-bold tracking-tight">Site9</Link>
          <p className="text-muted-foreground text-sm">
            {step === 1 ? "Claim your free website address" : "Create your account to continue"}
          </p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2" data-testid="start-progress">
          <div className={`h-1 flex-1 rounded-full ${step >= 1 ? "bg-brand" : "bg-border"}`} />
          <div className={`h-1 flex-1 rounded-full ${step >= 2 ? "bg-brand" : "bg-border"}`} />
        </div>

        {step === 1 && (
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="businessName">What&apos;s your business called?</Label>
              <Input
                id="businessName"
                data-testid="start-business-name"
                placeholder="e.g. Sunrise Cafe"
                value={businessName}
                onChange={e => onBusinessName(e.target.value)}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Your website address</Label>
              <div className="flex items-center rounded-lg border border-border bg-card focus-within:ring-2 focus-within:ring-brand/40">
                <input
                  id="slug"
                  data-testid="start-subdomain"
                  className="flex-1 bg-transparent px-3 py-2 text-sm outline-none"
                  placeholder="yourbusiness"
                  value={slug}
                  onChange={e => { setSlugEdited(true); applySlug(slugify(e.target.value)) }}
                />
                <span className="px-3 text-sm text-muted-foreground select-none">.{BASE_DOMAIN}</span>
              </div>

              {/* Availability status */}
              <div className="min-h-5 text-sm" data-testid="start-availability">
                {avail.state === "checking" && (
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Checking availability…
                  </span>
                )}
                {avail.state === "available" && (
                  <span className="flex items-center gap-1.5 text-green-600">
                    <Check className="h-3.5 w-3.5" /> {avail.host} is available
                  </span>
                )}
                {avail.state === "taken" && (
                  <span className="flex items-center gap-1.5 text-destructive">
                    <X className="h-3.5 w-3.5" /> {avail.reason}
                  </span>
                )}
              </div>
            </div>

            <Button
              className="w-full"
              variant="brand"
              data-testid="start-continue"
              disabled={!canContinue}
              onClick={() => { setName(""); setStep(2) }}
            >
              Continue <ArrowRight className="h-4 w-4" />
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Already have a site?{" "}
              <Link href="/login" className="text-foreground font-medium hover:underline">Sign in</Link>
            </p>
          </div>
        )}

        {step === 2 && (
          <form onSubmit={handleCreate} className="space-y-5">
            <div className="rounded-lg border border-border bg-card px-4 py-3 text-sm flex items-center justify-between">
              <span className="text-muted-foreground">Your address</span>
              <span className="font-medium">{slug}.{BASE_DOMAIN}</span>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Your name</Label>
              <Input id="name" data-testid="start-name" placeholder="Jane Smith" value={name} onChange={e => setName(e.target.value)} required autoFocus />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" data-testid="start-email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  data-testid="start-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  minLength={8}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  data-testid="start-password-toggle"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-r-lg"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && <p className="text-sm text-destructive" data-testid="start-error">{error}</p>}

            <Button type="submit" className="w-full" variant="brand" loading={loading} data-testid="start-create">
              Create account &amp; start building
            </Button>
            <button
              type="button"
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mx-auto"
              onClick={() => setStep(1)}
              data-testid="start-back"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

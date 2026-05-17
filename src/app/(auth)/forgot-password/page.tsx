"use client"
import { useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    setSent(true)
    setLoading(false)
  }

  if (sent) return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center space-y-4 max-w-sm">
        <div className="text-4xl">📬</div>
        <h1 className="text-xl font-semibold">Check your email</h1>
        <p className="text-muted-foreground text-sm">We sent a password reset link to <strong>{email}</strong></p>
        <Link href="/login" className="text-sm text-foreground hover:underline">Back to login</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <Link href="/" className="text-2xl font-bold tracking-tight">0→X</Link>
          <h1 className="text-lg font-semibold">Reset your password</h1>
          <p className="text-muted-foreground text-sm">Enter your email and we&apos;ll send a reset link</p>
        </div>
        <form onSubmit={handleReset} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <Button type="submit" className="w-full" loading={loading}>Send reset link</Button>
        </form>
        <p className="text-center text-sm">
          <Link href="/login" className="text-muted-foreground hover:text-foreground">Back to login</Link>
        </p>
      </div>
    </div>
  )
}

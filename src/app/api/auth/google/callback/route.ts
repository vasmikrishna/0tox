import { NextResponse } from "next/server"
import { createSession } from "@/lib/session"

export async function GET(req: Request) {
  const { searchParams, origin } = new URL(req.url)
  const code = searchParams.get("code")
  const error = searchParams.get("error")

  if (error || !code) {
    return NextResponse.redirect(`${origin}/login?error=google_cancelled`)
  }

  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? origin
    const redirectUri = `${appUrl}/api/auth/google/callback`

    // Exchange code for access token
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    })

    const tokens = await tokenRes.json()
    if (!tokenRes.ok) throw new Error(`Token exchange failed: ${tokens.error}`)

    // Get Google user info
    const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })
    const googleUser = await userRes.json()
    if (!googleUser.email) throw new Error("No email returned from Google")

    // Admin check
    const adminEmail = process.env.ADMIN_EMAIL ?? "admin@nexoit.com.au"
    if (googleUser.email === adminEmail) {
      await createSession({ id: "admin", email: googleUser.email, name: googleUser.name ?? "Admin", role: "admin" })
      return NextResponse.redirect(`${origin}/admin/dashboard`)
    }

    // Upsert client in Supabase (plain DB — no Supabase auth)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    let userId = googleUser.id ?? googleUser.sub
    let userName = googleUser.name ?? googleUser.email

    if (supabaseUrl?.startsWith("http") && supabaseKey) {
      try {
        const { createClient } = await import("@supabase/supabase-js")
        const supabase = createClient(supabaseUrl, supabaseKey)
        const { data: user } = await supabase
          .from("users")
          .upsert(
            { email: googleUser.email, name: googleUser.name ?? googleUser.email, role: "client" },
            { onConflict: "email" }
          )
          .select("id, name, role")
          .single()
        if (user) { userId = user.id; userName = user.name }
      } catch {}
    }

    await createSession({ id: userId, email: googleUser.email, name: userName, role: "client" })
    return NextResponse.redirect(`${origin}/client/dashboard`)
  } catch (err) {
    console.error("[google/callback]", err)
    return NextResponse.redirect(`${origin}/login?error=google_failed`)
  }
}

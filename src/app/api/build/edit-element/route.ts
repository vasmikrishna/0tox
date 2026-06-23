import { NextResponse } from "next/server"
import { getOwnerContext } from "@/lib/build-owner"

export const runtime = "nodejs"
export const maxDuration = 60

const DEEPSEEK_BASE = "https://api.deepseek.com"

export async function POST(req: Request) {
  const owner = await getOwnerContext()
  if (!owner) return NextResponse.json({ error: "Not signed in" }, { status: 401 })

  const deepseekKey = process.env.DEEPSEEK_API_KEY
  if (!deepseekKey) {
    return NextResponse.json({ error: "No AI configured." }, { status: 503 })
  }

  const body = await req.json().catch(() => ({}))
  const currentContent = String(body.currentContent ?? "").trim()
  const instruction = String(body.instruction ?? "").trim()
  const businessName = String(body.businessName ?? owner.tenant.name ?? "")

  if (!instruction) {
    return NextResponse.json({ error: "Describe what you want to change." }, { status: 400 })
  }

  const systemPrompt = `You are editing a single element on a small business website. Return ONLY the updated HTML. Keep the same tags. No wrapping <html>/<body>. No explanation, no markdown fences.`
  const userPrompt = `Business: "${businessName}"\n\nCURRENT CONTENT:\n${currentContent}\n\nREQUEST:\n${instruction}`

  function clean(raw: string): string {
    return raw.trim().replace(/^```(?:html)?\s*/i, "").replace(/\s*```$/i, "").trim()
  }

  type Attempt = { label: string; fn: () => Promise<string> }
  const attempts: Attempt[] = []

  attempts.push({
    label: "DeepSeek/v4-flash",
    fn: async () => {
      const r = await fetch(`${DEEPSEEK_BASE}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${deepseekKey}` },
        body: JSON.stringify({ model: "deepseek-v4-flash", messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }], max_tokens: 2048, temperature: 0.7 }),
      })
      if (!r.ok) throw Object.assign(new Error(`HTTP ${r.status}`), { status: r.status })
      const d = await r.json()
      return clean(d.choices?.[0]?.message?.content ?? "")
    },
  })

  for (let i = 0; i < attempts.length; i++) {
    try {
      const content = await attempts[i].fn()
      if (!content) continue
      return NextResponse.json({ content })
    } catch (err: unknown) {
      console.log(`[edit-element] ${attempts[i].label} failed (${(err as { status?: number })?.status})`)
      if (i < attempts.length - 1) continue
      return NextResponse.json({ error: "AI is busy. Try again in a moment." }, { status: 502 })
    }
  }
  return NextResponse.json({ error: "Could not edit. Please try again." }, { status: 502 })
}

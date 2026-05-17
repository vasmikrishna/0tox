import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { stripe } from "@/lib/stripe"

export async function GET(req: NextRequest) {
  const paymentId = req.nextUrl.searchParams.get("payment_id")
  if (!paymentId) return NextResponse.json({ error: "Missing payment_id" }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL("/login", req.url))

  const { data: payment } = await supabase.from("payments").select("*, projects(title, client_id)").eq("id", paymentId).single()
  if (!payment) return NextResponse.json({ error: "Payment not found" }, { status: 404 })
  if ((payment.projects as any).client_id !== user.id) return NextResponse.json({ error: "Unauthorized" }, { status: 403 })

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [{
      price_data: {
        currency: "usd",
        product_data: { name: `${(payment.projects as any).title} — ${payment.label}` },
        unit_amount: Math.round(payment.amount * 100),
      },
      quantity: 1,
    }],
    metadata: { payment_id: paymentId },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/client/projects/${(payment as any).project_id}?paid=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/client/projects/${(payment as any).project_id}`,
  })

  return NextResponse.redirect(session.url!)
}

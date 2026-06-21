import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getStripe } from "@/lib/stripe"
import { getSession } from "@/lib/session"
import type { Payment } from "@/types"

type CheckoutPayment = Payment & {
  projects?: { title?: string; client_id?: string } | { title?: string; client_id?: string }[]
}

export async function GET(req: NextRequest) {
  const paymentId = req.nextUrl.searchParams.get("payment_id")
  if (!paymentId) return NextResponse.json({ error: "Missing payment_id" }, { status: 400 })

  const supabase = createClient()
  const appSession = await getSession()
  if (!appSession) return NextResponse.redirect(new URL("/login", req.url))

  const { data: payment } = await supabase.from("payments").select("*, projects(title, client_id)").eq("id", paymentId).single()
  if (!payment) return NextResponse.json({ error: "Payment not found" }, { status: 404 })
  const checkoutPayment = payment as unknown as CheckoutPayment
  const project = Array.isArray(checkoutPayment.projects) ? checkoutPayment.projects[0] : checkoutPayment.projects
  if (project?.client_id !== appSession.id) return NextResponse.json({ error: "Unauthorized" }, { status: 403 })

  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [{
      price_data: {
        currency: "usd",
        product_data: { name: `${project?.title ?? "Project"} — ${checkoutPayment.label}` },
        unit_amount: Math.round(checkoutPayment.amount * 100),
      },
      quantity: 1,
    }],
    metadata: { payment_id: paymentId },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/client/projects/${checkoutPayment.project_id}?paid=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/client/projects/${checkoutPayment.project_id}`,
  })

  return NextResponse.redirect(session.url!)
}

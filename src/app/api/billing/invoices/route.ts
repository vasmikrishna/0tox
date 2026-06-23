import { NextResponse } from "next/server"
import { getOwnerContext } from "@/lib/build-owner"
import { listInvoices } from "@/lib/subscription"

/**
 * GET /api/billing/invoices
 * List all invoices for the signed-in tenant's subscription.
 */
export async function GET(req: Request) {
  const owner = await getOwnerContext()
  if (!owner) return NextResponse.json({ error: "Not signed in" }, { status: 401 })

  const invoices = await listInvoices(owner.tenant.id)
  return NextResponse.json({ invoices })
}

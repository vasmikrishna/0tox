import { createClient } from "@/lib/supabase/server"
import type { PlanKey } from "@/lib/razorpay"

/**
 * Tenant subscription helpers. One row per tenant in `subscriptions`.
 * A tenant can always publish; an active subscription only hides the upsell.
 */

export interface Subscription {
  id: string
  tenant_id: string
  plan: PlanKey
  status: string
  razorpay_subscription_id: string | null
  razorpay_plan_id: string | null
  razorpay_customer_id: string | null
  short_url: string | null
  current_end: string | null
  cancel_at_period_end: boolean
  cancelled_at: string | null
  created_at: string
  updated_at: string
}

/** A recorded subscription charge — one row per Razorpay invoice. */
export interface SubscriptionInvoice {
  id: string
  tenant_id: string
  subscription_id: string | null
  razorpay_invoice_id: string | null
  razorpay_payment_id: string | null
  amount: number // paise
  currency: string
  status: string
  period_start: string | null
  period_end: string | null
  invoice_url: string | null
  paid_at: string | null
  created_at: string
}

/** Razorpay statuses that unlock the "full potential" features. */
const ACTIVE_STATUSES = new Set(["authenticated", "active"])

/** True when the subscription currently entitles the tenant. */
export function isSubscriptionActive(sub: Subscription | null): boolean {
  if (!sub) return false
  if (!ACTIVE_STATUSES.has(sub.status)) return false
  // current_end is the end of the paid period; null means no expiry recorded yet.
  if (sub.current_end && new Date(sub.current_end).getTime() < Date.now()) return false
  return true
}

export async function getSubscriptionByTenant(tenantId: string): Promise<Subscription | null> {
  const supabase = createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- hand-written DB types
  const { data } = await (supabase as any)
    .from("subscriptions")
    .select("*")
    .eq("tenant_id", tenantId)
    .maybeSingle()
  return (data as Subscription) ?? null
}

/** Public-facing subscription status for a tenant (safe to send to the client). */
export interface SubscriptionStatus {
  active: boolean
  plan: PlanKey | null
  status: string | null
  currentEnd: string | null
  cancelAtPeriodEnd: boolean
}

export async function getSubscriptionStatus(tenantId: string): Promise<SubscriptionStatus> {
  const sub = await getSubscriptionByTenant(tenantId)
  return {
    active: isSubscriptionActive(sub),
    plan: sub?.plan ?? null,
    status: sub?.status ?? null,
    currentEnd: sub?.current_end ?? null,
    cancelAtPeriodEnd: sub?.cancel_at_period_end ?? false,
  }
}

/**
 * Insert or update the tenant's single subscription row. Keyed on tenant_id so
 * re-subscribing reuses the same row.
 */
export async function upsertSubscription(
  tenantId: string,
  fields: Partial<Omit<Subscription, "id" | "tenant_id" | "created_at" | "updated_at">>,
): Promise<void> {
  const supabase = createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- hand-written DB types
  await (supabase as any)
    .from("subscriptions")
    .upsert({ tenant_id: tenantId, ...fields }, { onConflict: "tenant_id" })
}

/** Update a subscription row by its Razorpay id (used by the webhook). */
export async function updateSubscriptionByRazorpayId(
  razorpaySubscriptionId: string,
  fields: {
    status?: string
    current_end?: string | null
    cancel_at_period_end?: boolean
    cancelled_at?: string | null
  },
): Promise<void> {
  const supabase = createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- hand-written DB types
  await (supabase as any)
    .from("subscriptions")
    .update(fields)
    .eq("razorpay_subscription_id", razorpaySubscriptionId)
}

/**
 * Record a subscription charge. Idempotent on razorpay_invoice_id — a repeated
 * webhook for the same invoice is ignored. Returns true if a new row was added.
 */
export async function recordInvoice(
  tenantId: string,
  fields: Partial<Omit<SubscriptionInvoice, "id" | "tenant_id" | "created_at">>,
): Promise<boolean> {
  const supabase = createClient()

  if (fields.razorpay_invoice_id) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- hand-written DB types
    const { data: existing } = await (supabase as any)
      .from("subscription_invoices")
      .select("id")
      .eq("razorpay_invoice_id", fields.razorpay_invoice_id)
      .maybeSingle()
    if (existing) return false
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- hand-written DB types
  const { error } = await (supabase as any)
    .from("subscription_invoices")
    .insert({ tenant_id: tenantId, ...fields })
  return !error
}

/** List a tenant's invoices, newest first. */
export async function listInvoices(tenantId: string): Promise<SubscriptionInvoice[]> {
  const supabase = createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- hand-written DB types
  const { data } = await (supabase as any)
    .from("subscription_invoices")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
  return (data as SubscriptionInvoice[]) ?? []
}

/** Find the tenant that owns a given Razorpay subscription id (webhook helper). */
export async function getTenantIdByRazorpaySubscription(
  razorpaySubscriptionId: string,
): Promise<{ tenant_id: string; id: string } | null> {
  const supabase = createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- hand-written DB types
  const { data } = await (supabase as any)
    .from("subscriptions")
    .select("id, tenant_id")
    .eq("razorpay_subscription_id", razorpaySubscriptionId)
    .maybeSingle()
  return (data as { tenant_id: string; id: string }) ?? null
}

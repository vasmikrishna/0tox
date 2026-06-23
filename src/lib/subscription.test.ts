// Unit tests for subscription entitlement logic.
// Run: pnpm test
import { test } from "node:test"
import assert from "node:assert/strict"
import { isSubscriptionActive, type Subscription } from "./subscription"

function sub(overrides: Partial<Subscription>): Subscription {
  return {
    id: "s1",
    tenant_id: "t1",
    plan: "monthly",
    status: "active",
    razorpay_subscription_id: "sub_x",
    razorpay_plan_id: "plan_x",
    razorpay_customer_id: null,
    short_url: null,
    current_end: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  }
}

const future = new Date(Date.now() + 86_400_000).toISOString()
const past = new Date(Date.now() - 86_400_000).toISOString()

test("null subscription is not active", () => {
  assert.equal(isSubscriptionActive(null), false)
})

test("active status with no end date entitles", () => {
  assert.equal(isSubscriptionActive(sub({ status: "active", current_end: null })), true)
})

test("authenticated status entitles (mandate set, awaiting first charge)", () => {
  assert.equal(isSubscriptionActive(sub({ status: "authenticated" })), true)
})

test("active but past current_end does not entitle", () => {
  assert.equal(isSubscriptionActive(sub({ status: "active", current_end: past })), false)
})

test("active within current_end entitles", () => {
  assert.equal(isSubscriptionActive(sub({ status: "active", current_end: future })), true)
})

test("created / halted / cancelled do not entitle", () => {
  for (const status of ["created", "halted", "cancelled", "completed", "pending", "paused"]) {
    assert.equal(isSubscriptionActive(sub({ status })), false, `${status} should not entitle`)
  }
})

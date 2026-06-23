/**
 * One-time Razorpay plan setup. Creates the Monthly (₹29) and Annual (₹108)
 * subscription plans, then prints the plan IDs to paste into .env.local.
 *
 * Usage:
 *   set -a && source .env.local && set +a && pnpm exec tsx src/scripts/razorpay-setup.ts
 *
 * Required env: RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET
 * After running, set: RAZORPAY_PLAN_MONTHLY_ID, RAZORPAY_PLAN_ANNUAL_ID
 */

import Razorpay from "razorpay"

const key_id = process.env.RAZORPAY_KEY_ID?.trim()
const key_secret = process.env.RAZORPAY_KEY_SECRET?.trim()

if (!key_id || !key_secret) {
  console.error("✗ RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET missing. Source .env.local first.")
  process.exit(1)
}

const rzp = new Razorpay({ key_id, key_secret })

const PLANS = [
  {
    envVar: "RAZORPAY_PLAN_MONTHLY_ID",
    period: "monthly" as const,
    interval: 1,
    amount: 2900, // ₹29
    name: "0tox Pro — Monthly",
  },
  {
    envVar: "RAZORPAY_PLAN_ANNUAL_ID",
    period: "yearly" as const,
    interval: 1,
    amount: 10800, // ₹108 (₹9/month)
    name: "0tox Pro — Annual",
  },
]

async function main() {
  console.log("Creating Razorpay plans…\n")
  for (const p of PLANS) {
    const plan = await rzp.plans.create({
      period: p.period,
      interval: p.interval,
      item: { name: p.name, amount: p.amount, currency: "INR" },
    })
    console.log(`✓ ${p.name}`)
    console.log(`  ${p.envVar}=${plan.id}\n`)
  }
  console.log("Done. Paste the IDs above into .env.local.")
}

main().catch((err) => {
  console.error("✗ Failed to create plans:", err?.message ?? err)
  process.exit(1)
})

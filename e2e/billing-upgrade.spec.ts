import { test, expect } from "@playwright/test"

/**
 * E2E: Razorpay subscription soft-upsell on the builder. (Issue #4)
 *
 * Prereqs:
 *   - dev server running (pnpm dev) on BASE_URL
 *   - a signed-in tenant session WITHOUT an active subscription, on /build
 *
 * These cover the gating UI; the Razorpay Checkout widget itself is external
 * and stubbed/skipped here. With no RAZORPAY_* env set, the subscribe call uses
 * the dev fallback and the banner disappears after clicking a plan.
 */

test.describe("Builder upgrade upsell", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/build")
  })

  test("unsubscribed tenant sees the upgrade banner", async ({ page }) => {
    await expect(page.getByTestId("upgrade-banner")).toBeVisible()
  })

  test("opening the dialog shows both plans", async ({ page }) => {
    await page.getByTestId("open-upgrade-dialog").click()
    await expect(page.getByTestId("upgrade-dialog")).toBeVisible()
    await expect(page.getByTestId("subscribe-monthly")).toContainText("₹29")
    await expect(page.getByTestId("subscribe-annual")).toContainText("₹108")
  })

  test("dev fallback unlocks and hides the banner", async ({ page }) => {
    // Only meaningful when RAZORPAY_* keys are absent (dev fallback path).
    await page.getByTestId("open-upgrade-dialog").click()
    await page.getByTestId("subscribe-annual").click()
    await expect(page.getByTestId("upgrade-banner")).toBeHidden()
  })
})

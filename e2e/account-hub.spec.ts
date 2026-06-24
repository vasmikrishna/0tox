import { test, expect } from "@playwright/test"

/**
 * E2E: Customer accounts + unified "My Businesses" hub. (Issue #7)
 *
 * Prereqs (mirrors e2e/billing-upgrade.spec.ts conventions):
 *   - dev server running (pnpm dev) on BASE_URL pointed at a tenant's public site
 *   - For the logged-in specs: a session that belongs to at least one tenant
 *     (the session cookie is shared across *.site9.in). Run the logged-out spec
 *     in a fresh context.
 *
 * These assert the visible entry points and hub structure via data-testids; they
 * don't drive the cross-subdomain "Enter" navigation (that leaves the app origin).
 */

test.describe("Public site auth entry points (logged out)", () => {
  test("header shows Sign in and Sign up", async ({ page }) => {
    await page.goto("/")
    await expect(page.getByTestId("header-signin")).toBeVisible()
    await expect(page.getByTestId("header-signup")).toBeVisible()
  })

  test("Sign in links to the login page", async ({ page }) => {
    await page.goto("/")
    await page.getByTestId("header-signin").click()
    await expect(page).toHaveURL(/\/login/)
  })
})

test.describe("My Businesses hub (logged in)", () => {
  test("hub renders with a create-new-site CTA", async ({ page }) => {
    await page.goto("/account")
    await expect(page.getByTestId("account-hub")).toBeVisible()
    await expect(page.getByTestId("account-hub-create")).toBeVisible()
  })

  test("the public header shows the account menu when signed in", async ({ page }) => {
    await page.goto("/")
    await page.getByTestId("account-menu-button").click()
    await expect(page.getByTestId("account-menu-businesses")).toBeVisible()
  })
})

test.describe("Customer portal (logged-in client)", () => {
  test("bookings view loads", async ({ page }) => {
    await page.goto("/client/bookings")
    await expect(page.getByTestId("client-bookings")).toBeVisible()
  })

  test("profile view loads", async ({ page }) => {
    await page.goto("/client/profile")
    await expect(page.getByTestId("client-profile")).toBeVisible()
  })
})

import { defineConfig, devices } from "@playwright/test"

// E2E config for 0tox. Requires: pnpm add -D @playwright/test && pnpm exec playwright install
// Run: pnpm test:e2e  (expects the dev server on BASE_URL, default http://localhost:3000)
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: process.env.BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
})

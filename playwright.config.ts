import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  projects: [
    {
      name: "ecommerce",
      testDir: "apps/ecommerce/e2e",
      use: { ...devices["Desktop Chrome"], baseURL: "http://localhost:3000" },
    },
    {
      name: "admin",
      testDir: "apps/admin/e2e",
      use: { ...devices["Desktop Chrome"], baseURL: "http://localhost:3001" },
    },
  ],
  webServer: [
    {
      command: "pnpm --filter @de-tin-marin/ecommerce dev",
      url: "http://localhost:3000",
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: "pnpm --filter @de-tin-marin/admin dev",
      url: "http://localhost:3001",
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});

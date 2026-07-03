import { test, expect } from "@playwright/test";

test.describe("admin bundles smoke", () => {
  test("redirects unauthenticated users to login from bundles", async ({
    page,
  }) => {
    await page.goto("/bundles");
    await expect(page).toHaveURL(/\/login/);
  });
});

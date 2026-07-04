import { test, expect } from "@playwright/test";

test.describe("admin orders smoke", () => {
  test("redirects unauthenticated users to login from orders", async ({
    page,
  }) => {
    await page.goto("/orders");
    await expect(page).toHaveURL(/\/login/);
  });
});

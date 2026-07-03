import { test, expect } from "@playwright/test";

test.describe("admin catalog smoke", () => {
  test("login page loads", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Admin" })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
  });

  test("redirects unauthenticated users to login from products", async ({
    page,
  }) => {
    await page.goto("/products");
    await expect(page).toHaveURL(/\/login/);
  });
});

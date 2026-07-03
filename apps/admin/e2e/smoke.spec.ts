import { test, expect } from "@playwright/test";

test("admin redirects to login when unauthenticated", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole("heading", { name: "Admin" })).toBeVisible();
});

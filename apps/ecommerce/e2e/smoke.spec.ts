import { test, expect } from "@playwright/test";

test("home page loads", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /endulza cada sorpresa/i }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "De Tin Marín" })).toBeVisible();
});

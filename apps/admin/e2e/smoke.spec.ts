import { test, expect } from "@playwright/test";

test("admin home loads", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /panel administrativo/i }),
  ).toBeVisible();
  await expect(page.getByText("De Tin Marín").first()).toBeVisible();
});

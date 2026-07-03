import { test, expect } from "@playwright/test";

test("home page loads", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /tienda de dulces/i }),
  ).toBeVisible();
  await expect(page.getByText("De Tin Marín")).toBeVisible();
});

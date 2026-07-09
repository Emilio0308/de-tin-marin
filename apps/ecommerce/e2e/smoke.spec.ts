import { test, expect } from "@playwright/test";

test("home page loads", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /endulza cada sorpresa/i }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "De Tin Marín" })).toBeVisible();
  await expect(
    page.getByRole("link", { name: /ver sorpresas/i }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: /ver dulces/i })).toBeVisible();
  await expect(page.getByRole("tab", { name: /dulces/i })).toHaveAttribute(
    "aria-selected",
    "true",
  );
});

test("storefront tabs load catalog", async ({ page }) => {
  await page.goto("/?tab=productos");
  await expect(page.getByPlaceholder(/buscar por nombre o sku/i)).toBeVisible();

  await page.goto("/?tab=sorpresas");
  await expect(
    page.getByRole("searchbox", { name: /buscar sorpresas…/i }),
  ).toBeVisible();
});

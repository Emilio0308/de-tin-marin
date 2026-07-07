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
});

test("catalog routes load", async ({ page }) => {
  await page.goto("/productos");
  await expect(
    page.getByRole("heading", { name: /nuestros dulces/i }),
  ).toBeVisible();

  await page.goto("/sorpresas");
  await expect(
    page.getByRole("heading", { name: /combos sorpresa/i }),
  ).toBeVisible();
});

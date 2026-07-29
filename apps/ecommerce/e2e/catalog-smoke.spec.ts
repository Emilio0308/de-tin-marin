import { test, expect } from "@playwright/test";

test.describe("catálogo público", () => {
  test("listado de productos carga con filtros", async ({ page }) => {
    await page.goto("/?tab=productos");
    await expect(page.getByRole("tab", { name: /dulces/i })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(
      page.getByPlaceholder(/buscar por nombre o sku/i),
    ).toBeVisible();
    await expect(page.getByRole("combobox")).toBeVisible();
    await expect(page.getByRole("button", { name: /^todas$/i })).toBeVisible();
  });

  test("filtrar por categoría actualiza la URL", async ({ page }) => {
    await page.goto("/?tab=productos");
    const categoryButtons = page
      .locator("aside nav button")
      .filter({ hasNotText: /^todas$/i });
    const count = await categoryButtons.count();
    if (count === 0) {
      test.skip();
    }

    const firstCategory = categoryButtons.first();
    await firstCategory.click();
    await expect(page).toHaveURL(/categoryId=/);
  });

  test("búsqueda por SKU actualiza la URL", async ({ page }) => {
    await page.goto("/?tab=productos");
    const searchInput = page.getByPlaceholder(/buscar por nombre o sku/i);
    await searchInput.fill("SKU-TEST-404");
    await searchInput.press("Enter");
    await expect(page).toHaveURL(/search=SKU-TEST-404/);
  });

  test("listado de sorpresas carga", async ({ page }) => {
    await page.goto("/?tab=sorpresas");
    await expect(page.getByRole("tab", { name: /sorpresas/i })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(
      page.getByRole("searchbox", { name: /buscar sorpresas…/i }),
    ).toBeVisible();
  });
});

import { test, expect } from "@playwright/test";

test.describe("wizard de personalización", () => {
  test("personaliza sorpresa, cambia composición y ve total", async ({
    page,
  }) => {
    await page.goto("/sorpresas");
    await expect(
      page.getByRole("heading", { name: /combos sorpresa/i }),
    ).toBeVisible();

    const personalizeLinks = page.getByRole("link", { name: /personalizar/i });
    const linkCount = await personalizeLinks.count();
    if (linkCount === 0) {
      test.skip();
    }

    await personalizeLinks.first().click();
    await expect(page).toHaveURL(/\/sorpresas\/[^/]+\/personalizar/);
    await expect(
      page.getByRole("heading", { name: /personaliza tu sorpresa/i }),
    ).toBeVisible();

    const totalHeading = page.getByText(/total de tu sorpresa/i);
    await expect(totalHeading).toBeVisible();

    const initialTotal = page.locator(".text-price-display").first();
    await expect(initialTotal).toBeVisible({ timeout: 15000 });
    const initialTotalText = await initialTotal.textContent();

    const removeButtons = page.getByRole("button", { name: /^quitar$/i });
    const removeCount = await removeButtons.count();
    if (removeCount === 0) {
      test.skip();
    }

    await removeButtons.first().click();

    const searchInput = page.getByPlaceholder(/buscar por nombre o sku/i);
    await searchInput.fill("a");
    await searchInput.press("Enter");

    const addButtons = page.getByRole("button", { name: /^agregar$/i });
    const addCount = await addButtons.count();
    if (addCount === 0) {
      test.skip();
    }

    await addButtons.first().click();

    await expect
      .poll(async () => initialTotal.textContent(), { timeout: 15000 })
      .not.toBe(initialTotalText);
  });
});

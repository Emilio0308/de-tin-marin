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

    for (let index = 0; index < removeCount; index += 1) {
      const button = removeButtons.nth(index);
      if (await button.isEnabled()) {
        await button.click();
        break;
      }
    }

    const searchInput = page.getByPlaceholder(/buscar por nombre o sku/i);
    await searchInput.fill("a");
    await searchInput.press("Enter");

    const addButtons = page.getByRole("button", { name: /^agregar$/i });
    const addCount = await addButtons.count();
    if (addCount === 0) {
      test.skip();
    }

    const enabledAddButton = addButtons
      .filter({ hasNotText: /agregado/i })
      .first();
    await expect(enabledAddButton).toBeEnabled({ timeout: 15000 });
    await enabledAddButton.click();

    await expect
      .poll(async () => initialTotal.textContent(), { timeout: 15000 })
      .not.toBe(initialTotalText);
  });

  test("agregar al carrito redirige a /carrito", async ({ page }) => {
    await page.goto("/sorpresas");
    const personalizeLinks = page.getByRole("link", { name: /personalizar/i });
    if ((await personalizeLinks.count()) === 0) {
      test.skip();
    }

    await personalizeLinks.first().click();
    await expect(page).toHaveURL(/\/sorpresas\/[^/]+\/personalizar/);

    const addToCartButton = page.getByRole("button", {
      name: /agregar al carrito/i,
    });
    await expect(addToCartButton).toBeEnabled({ timeout: 15000 });
    await addToCartButton.click();

    await expect(page).toHaveURL(/\/carrito/, { timeout: 15000 });
    await expect(
      page.getByRole("heading", { name: /tu carrito/i }),
    ).toBeVisible();
  });

  test("doble click en agregar al carrito no duplica la línea", async ({
    page,
  }) => {
    await page.goto("/sorpresas");
    const personalizeLinks = page.getByRole("link", { name: /personalizar/i });
    if ((await personalizeLinks.count()) === 0) {
      test.skip();
    }

    await personalizeLinks.first().click();
    await expect(page).toHaveURL(/\/sorpresas\/[^/]+\/personalizar/);

    const addToCartButton = page.getByRole("button", {
      name: /agregar al carrito/i,
    });
    await expect(addToCartButton).toBeEnabled({ timeout: 15000 });
    await addToCartButton.dblclick();

    await expect(page).toHaveURL(/\/carrito/, { timeout: 15000 });

    const cartLines = page.locator(
      "ul.space-y-4 > li.rounded-2xl.border.border-outline-variant",
    );
    await expect(cartLines).toHaveCount(1, { timeout: 5000 });
  });
});

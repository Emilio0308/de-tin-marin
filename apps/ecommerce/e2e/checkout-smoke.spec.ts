import { test, expect } from "@playwright/test";

test.describe("checkout guest", () => {
  test("carrito → checkout → confirmación", async ({ page }) => {
    await page.goto("/productos");
    await expect(
      page.getByRole("heading", { name: /nuestros dulces/i }),
    ).toBeVisible();

    const addButtons = page.getByRole("button", { name: /^añadir$/i });
    const addCount = await addButtons.count();
    if (addCount === 0) {
      test.skip();
    }

    await addButtons.first().click();

    await page.goto("/carrito");
    await expect(
      page.getByRole("heading", { name: /tu carrito/i }),
    ).toBeVisible();
    await expect(page.getByText(/subtotal/i)).toBeVisible();

    await page.getByRole("link", { name: /ir a checkout/i }).click();
    await expect(page).toHaveURL(/\/checkout/);
    await expect(
      page.getByRole("heading", { name: /^checkout$/i }),
    ).toBeVisible();

    await page.getByPlaceholder(/nombre/i).fill("Ana");
    await page.getByPlaceholder(/apellido/i).fill("García");
    await page.getByPlaceholder(/teléfono/i).fill("999888777");
    await page.getByPlaceholder(/correo electrónico/i).fill("ana@example.com");
    await page.getByPlaceholder(/^dirección$/i).fill("Av. Grau 123");

    const districtSelect = page.locator("select").first();
    const districtOptions = districtSelect.locator("option");
    const optionCount = await districtOptions.count();
    if (optionCount <= 1) {
      test.skip();
    }

    const piuraOption = districtOptions.filter({ hasText: /^piura$/i });
    if ((await piuraOption.count()) > 0) {
      await districtSelect.selectOption({ label: "Piura" });
    } else {
      const firstDistrict = await districtOptions.nth(1).textContent();
      if (!firstDistrict?.trim()) {
        test.skip();
      }
      await districtSelect.selectOption({ label: firstDistrict!.trim() });
    }

    const submitButton = page.getByRole("button", {
      name: /confirmar pedido/i,
    });
    await expect(submitButton).toBeEnabled({ timeout: 15000 });

    await submitButton.click();

    await expect(page).toHaveURL(/\/pedido\/confirmacion\?orderNumber=/, {
      timeout: 30000,
    });
    await expect(page.getByText(/TM-/i)).toBeVisible();
  });
});

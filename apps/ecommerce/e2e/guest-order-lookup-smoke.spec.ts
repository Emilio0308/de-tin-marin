import { test, expect } from "@playwright/test";

test.describe("lookup guest", () => {
  test("checkout → confirmación → mis pedidos", async ({ page }) => {
    const testEmail = `guest-${Date.now()}@example.com`;

    await page.goto("/productos");
    const addButtons = page.getByRole("button", { name: /^añadir$/i });
    if ((await addButtons.count()) === 0) {
      test.skip();
    }

    await addButtons.first().click();
    await page.goto("/checkout");

    await page.getByPlaceholder(/nombre/i).fill("Ana");
    await page.getByPlaceholder(/apellido/i).fill("García");
    await page.getByPlaceholder(/teléfono/i).fill("999888777");
    await page.getByPlaceholder(/correo electrónico/i).fill(testEmail);
    await page.getByPlaceholder(/^dirección$/i).fill("Av. Grau 123");

    const districtSelect = page.locator("select").first();
    const optionCount = await districtSelect.locator("option").count();
    if (optionCount <= 1) {
      test.skip();
    }

    const piuraOption = districtSelect.locator("option").filter({
      hasText: /^piura$/i,
    });
    if ((await piuraOption.count()) > 0) {
      await districtSelect.selectOption({ label: "Piura" });
    } else {
      const firstDistrict = await districtSelect
        .locator("option")
        .nth(1)
        .textContent();
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

    await expect(page).toHaveURL(
      /\/pedido\/confirmacion\?orderNumber=.*&email=/,
      {
        timeout: 30000,
      },
    );

    const orderNumberText = await page
      .getByText(/número de pedido:\s*TM-/i)
      .textContent();
    const orderNumberMatch = orderNumberText?.match(/TM-[^\s]+/i);
    if (!orderNumberMatch) {
      test.skip();
    }
    const orderNumber = orderNumberMatch[0];

    await expect(
      page.getByRole("heading", { name: /instrucciones de pago/i }),
    ).toBeVisible({ timeout: 15000 });

    await page.goto("/mis-pedidos");
    await page.getByPlaceholder(/número de pedido/i).fill(orderNumber);
    await page.getByPlaceholder(/correo electrónico/i).fill(testEmail);
    await page.getByRole("button", { name: /buscar pedido/i }).click();

    await expect(page.getByText(orderNumber)).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/pendiente de pago/i)).toBeVisible();
  });
});

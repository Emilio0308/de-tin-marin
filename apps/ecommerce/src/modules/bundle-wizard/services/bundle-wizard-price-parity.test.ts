import { describe, expect, it } from "vitest";
import { computeBundleTotal } from "@de-tin-marin/shared/bundle-price";
import { buildOrderCartWithTotals } from "@de-tin-marin/shared/build-order-cart";

describe("bundle wizard price parity", () => {
  it("preview con buildOrderCart coincide con computeBundleTotal del template", () => {
    const bundleId = "11111111-1111-4111-8111-111111111111";
    const containerId = "22222222-2222-4222-8222-222222222222";
    const personCount = 20;
    const containerNetPrice = 1.5;

    const templateTotal = computeBundleTotal({
      containerNetPrice,
      quantity: personCount,
      items: [
        { unitNetPrice: 1, unitsPerPerson: 1 },
        { unitNetPrice: 2, unitsPerPerson: 1 },
      ],
    });

    const cartResult = buildOrderCartWithTotals({
      lines: [
        {
          type: "bundle",
          bundleId,
          quantity: personCount,
          components: [
            { productId: "p1", quantityPerUnit: 1 },
            { productId: "p2", quantityPerUnit: 1 },
          ],
        },
      ],
      products: [
        {
          id: "p1",
          sku: "SKU-1",
          name: "Producto 1",
          prices: { normal: { netPrice: 1 }, unit: { netPrice: 1 } },
          campaign_id: null,
          items_per_package: 1,
        },
        {
          id: "p2",
          sku: "SKU-2",
          name: "Producto 2",
          prices: { normal: { netPrice: 2 }, unit: { netPrice: 2 } },
          campaign_id: null,
          items_per_package: 1,
        },
      ],
      campaigns: [],
      bundlesById: new Map([
        [
          bundleId,
          {
            id: bundleId,
            name: "Combo Fiesta",
            is_active: true,
            deleted_at: null,
            container: {
              id: containerId,
              sku: "C-1",
              name: "Caja",
              prices: { netPrice: containerNetPrice },
            },
          },
        ],
      ]),
    });

    expect(cartResult.ok).toBe(true);
    if (!cartResult.ok) return;

    const line = cartResult.shoppingCart.lines[0];
    expect(line?.type).toBe("bundle");
    if (!line || line.type !== "bundle") return;

    expect(line.lineTotal).toBe(templateTotal.total);
    expect(Math.abs(line.lineTotal - templateTotal.total)).toBeLessThanOrEqual(
      0.01,
    );
  });
});

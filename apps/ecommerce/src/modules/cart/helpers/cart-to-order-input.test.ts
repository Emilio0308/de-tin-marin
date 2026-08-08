import { describe, expect, it } from "vitest";
import { cartLinesToOrderInput } from "./cart-to-order-input";

describe("cartLinesToOrderInput", () => {
  it("convierte líneas producto, pack y bundle", () => {
    const result = cartLinesToOrderInput([
      {
        cartLineId: "line-1",
        line: {
          type: "product",
          productId: "p1",
          sku: "SKU-1",
          name: "Dulce",
          packageQuantity: 2,
          unitQuantity: 0,
          packagePrice: 5,
          unitPrice: 5,
          lineTotal: 10,
        },
      },
      {
        cartLineId: "line-pack",
        line: {
          type: "pack",
          packId: "pack-1",
          sku: "PACK-1",
          name: "Combo",
          quantity: 3,
          unitPrice: 20,
          lineTotal: 60,
          components: [],
        },
      },
      {
        cartLineId: "line-2",
        line: {
          type: "bundle",
          bundleId: "b1",
          name: "Sorpresa",
          quantity: 10,
          lineTotal: 90,
          container: {
            containerId: "c1",
            sku: "C-1",
            name: "Caja",
            unitPrice: 1.5,
          },
          components: [
            {
              productId: "p2",
              productName: "Gomita",
              sku: "SKU-2",
              quantityPerUnit: 1,
              totalQuantity: 10,
              unitPrice: 1,
            },
          ],
        },
      },
    ]);

    expect(result).toEqual([
      { type: "product", productId: "p1", packageQuantity: 2, unitQuantity: 0 },
      { type: "pack", packId: "pack-1", quantity: 3 },
      {
        type: "bundle",
        bundleId: "b1",
        quantity: 10,
        components: [{ productId: "p2", quantityPerUnit: 1 }],
      },
    ]);
  });
});

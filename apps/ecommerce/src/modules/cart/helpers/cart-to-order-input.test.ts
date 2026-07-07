import { describe, expect, it } from "vitest";
import { cartLinesToOrderInput } from "./cart-to-order-input";

describe("cartLinesToOrderInput", () => {
  it("convierte líneas producto y bundle", () => {
    const result = cartLinesToOrderInput([
      {
        cartLineId: "line-1",
        line: {
          type: "product",
          productId: "p1",
          sku: "SKU-1",
          name: "Dulce",
          quantity: 2,
          unitPrice: 5,
          lineTotal: 10,
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
      { type: "product", productId: "p1", quantity: 2 },
      {
        type: "bundle",
        bundleId: "b1",
        quantity: 10,
        components: [{ productId: "p2", quantityPerUnit: 1 }],
      },
    ]);
  });
});

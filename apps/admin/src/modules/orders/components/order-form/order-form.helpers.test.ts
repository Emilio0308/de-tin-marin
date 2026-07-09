import { describe, expect, it } from "vitest";
import {
  estimateOrderFormLineTotal,
  previewOrderTotals,
} from "./order-form.helpers";
import type { ProductOption } from "./order-form.types";

const packageProduct: ProductOption = {
  id: "p-package",
  name: "Tira gomitas",
  sku: "PKG-1",
  finalPrice: 50,
  finalUnitPrice: 5,
  imageUrl: null,
  productType: "package",
  itemsPerPackage: 10,
  stockTotalBaseUnits: 100,
  purchaseMinQuantity: 10,
  purchaseMaxQuantity: 100,
};

const unitProduct: ProductOption = {
  id: "p-unit",
  name: "Caramelo",
  sku: "UNIT-1",
  finalPrice: 2,
  finalUnitPrice: 2,
  imageUrl: null,
  productType: "unit",
  itemsPerPackage: 1,
  stockTotalBaseUnits: 100,
  purchaseMinQuantity: 10,
  purchaseMaxQuantity: 100,
};

const bundlesById = new Map([
  [
    "b1",
    {
      name: "Sorpresa",
      container: {
        containerId: "c1",
        sku: "BOX",
        name: "Caja",
        unitPrice: 15,
      },
    },
  ],
]);

describe("order-form.helpers fallback", () => {
  it("usa finalPrice para líneas de producto", () => {
    const total = estimateOrderFormLineTotal(
      { type: "product", productId: "p-unit", quantity: 10 },
      [unitProduct],
      bundlesById,
    );
    expect(total).toBe(20);
  });

  it("usa finalUnitPrice para componentes de sorpresa", () => {
    const components = Array.from({ length: 8 }, () => ({
      productId: "p-package",
      quantityPerUnit: 1,
    }));

    const total = estimateOrderFormLineTotal(
      {
        type: "bundle",
        bundleId: "b1",
        quantity: 2,
        components,
      },
      [packageProduct],
      bundlesById,
    );

    // dulces: 5 * 1 * 2 * 8 = 80; envases: 15 * 2 = 30 → 110
    expect(total).toBe(110);
  });

  it("calcula totales del carrito con líneas mixtas", () => {
    const components = Array.from({ length: 8 }, () => ({
      productId: "p-package",
      quantityPerUnit: 1,
    }));

    const totals = previewOrderTotals(
      {
        lines: [
          { type: "product", productId: "p-unit", quantity: 10 },
          {
            type: "bundle",
            bundleId: "b1",
            quantity: 1,
            components,
          },
        ],
        shippingTotal: 5,
        discountTotal: 0,
      },
      [unitProduct, packageProduct],
      bundlesById,
    );

    expect(totals?.subtotal).toBe(20 + 55);
    expect(totals?.total).toBe(20 + 55 + 5);
  });
});

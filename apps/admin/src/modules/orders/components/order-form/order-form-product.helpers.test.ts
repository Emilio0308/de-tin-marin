import { describe, expect, it } from "vitest";
import {
  resolveOrderFormProductBounds,
  resolveProductAddBlockReason,
} from "./order-form-product.helpers";
import type { ProductOption } from "./order-form.types";

const baseProduct: ProductOption = {
  id: "p1",
  name: "Gomitas",
  sku: "GOM-1",
  finalPrice: 5,
  finalUnitPrice: 5,
  imageUrl: null,
  productType: "unit",
  itemsPerPackage: 1,
  stockTotalBaseUnits: 100,
  purchaseMinQuantity: 10,
  purchaseMaxQuantity: 100,
};

describe("resolveProductAddBlockReason", () => {
  it("asks to select a product when none is chosen", () => {
    expect(resolveProductAddBlockReason(undefined, null)).toEqual({
      code: "NO_SELECTION",
    });
  });

  it("reports out of stock when stock is below purchase minimum", () => {
    const product = { ...baseProduct, stockTotalBaseUnits: 3 };
    const bounds = resolveOrderFormProductBounds(product);
    expect(resolveProductAddBlockReason(product, bounds)).toEqual({
      code: "OUT_OF_STOCK",
      minQuantity: 10,
      available: 3,
    });
  });

  it("allows adding when purchasable", () => {
    const bounds = resolveOrderFormProductBounds(baseProduct);
    expect(resolveProductAddBlockReason(baseProduct, bounds)).toBeNull();
  });
});

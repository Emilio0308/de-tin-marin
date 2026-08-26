import { describe, expect, it } from "vitest";
import {
  resolveOrderFormPackBounds,
  resolveOrderFormProductBounds,
  resolvePackAddBlockReason,
  resolveProductAddBlockReason,
} from "./order-form-product.helpers";
import type { PackOption, ProductOption } from "./order-form.types";

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

const basePack: PackOption = {
  id: "pack1",
  name: "Combo",
  sku: "COMBO-1",
  finalPrice: 20,
  availableQuantity: 50,
  stockShortages: [],
  purchaseMinQuantity: 5,
  purchaseMaxQuantity: 100,
  itemCount: 2,
};

describe("resolveOrderFormProductBounds", () => {
  it("ignores purchase min/max and caps by stock", () => {
    const product = { ...baseProduct, stockTotalBaseUnits: 5 };
    expect(resolveOrderFormProductBounds(product)).toEqual({
      minQuantity: 1,
      maxQuantity: 5,
      purchasable: true,
    });
  });
});

describe("resolveOrderFormPackBounds", () => {
  it("ignores purchase min/max and caps by availableQuantity", () => {
    const pack = {
      ...basePack,
      availableQuantity: 3,
      purchaseMinQuantity: 10,
      purchaseMaxQuantity: 100,
    };
    expect(resolveOrderFormPackBounds(pack)).toEqual({
      minQuantity: 1,
      maxQuantity: 3,
      purchasable: true,
    });
  });
});

describe("resolveProductAddBlockReason", () => {
  it("asks to select a product when none is chosen", () => {
    expect(resolveProductAddBlockReason(undefined, null)).toEqual({
      code: "NO_SELECTION",
    });
  });

  it("reports out of stock when available is 0", () => {
    const product = { ...baseProduct, stockTotalBaseUnits: 0 };
    const bounds = resolveOrderFormProductBounds(product);
    expect(resolveProductAddBlockReason(product, bounds)).toEqual({
      code: "OUT_OF_STOCK",
      minQuantity: 1,
      available: 0,
    });
  });

  it("allows adding below catalog purchase minimum when stock allows", () => {
    const product = { ...baseProduct, stockTotalBaseUnits: 3 };
    const bounds = resolveOrderFormProductBounds(product);
    expect(resolveProductAddBlockReason(product, bounds)).toBeNull();
  });

  it("allows package product with residual loose units", () => {
    const product: ProductOption = {
      ...baseProduct,
      productType: "package",
      itemsPerPackage: 12,
      stockTotalBaseUnits: 5,
    };
    const bounds = resolveOrderFormProductBounds(product);
    expect(bounds.purchasable).toBe(false);
    expect(resolveProductAddBlockReason(product, bounds)).toBeNull();
  });
});

describe("resolvePackAddBlockReason", () => {
  it("reports out of stock when availableQuantity is 0", () => {
    const pack = {
      ...basePack,
      availableQuantity: 0,
      stockShortages: [
        {
          productId: "11111111-1111-1111-1111-111111111111",
          productName: "Gomitas",
          sku: "GOM-1",
          availableCombos: 0,
          reason: "insufficient_stock" as const,
        },
      ],
    };
    const bounds = resolveOrderFormPackBounds(pack);
    expect(resolvePackAddBlockReason(pack, bounds)).toEqual({
      code: "OUT_OF_STOCK",
      minQuantity: 1,
      available: 0,
      stockShortages: pack.stockShortages,
    });
  });
});

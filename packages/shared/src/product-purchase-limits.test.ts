import { describe, expect, it } from "vitest";
import {
  clampProductPurchaseQuantity,
  mergeProductPurchaseQuantity,
  resolveProductPurchaseBounds,
  resolveStockInPresentations,
} from "./product-purchase-limits";

describe("resolveStockInPresentations", () => {
  it("usa unidades base para productos unit", () => {
    expect(
      resolveStockInPresentations({
        productType: "unit",
        itemsPerPackage: 1,
        stockTotalBaseUnits: 25,
      }),
    ).toBe(25);
  });

  it("convierte a presentaciones para productos package", () => {
    expect(
      resolveStockInPresentations({
        productType: "package",
        itemsPerPackage: 4,
        stockTotalBaseUnits: 48,
      }),
    ).toBe(12);
  });
});

describe("resolveProductPurchaseBounds", () => {
  it("acota max por stock y configuración", () => {
    const bounds = resolveProductPurchaseBounds({
      productType: "package",
      itemsPerPackage: 4,
      stockTotalBaseUnits: 48,
      purchaseMinQuantity: 10,
      purchaseMaxQuantity: 100,
    });

    expect(bounds).toEqual({
      minQuantity: 10,
      maxQuantity: 12,
      purchasable: true,
    });
  });

  it("marca no comprable si stock menor que min", () => {
    const bounds = resolveProductPurchaseBounds({
      productType: "unit",
      itemsPerPackage: 1,
      stockTotalBaseUnits: 8,
      purchaseMinQuantity: 10,
      purchaseMaxQuantity: 100,
    });

    expect(bounds.purchasable).toBe(false);
    expect(bounds.maxQuantity).toBe(10);
  });
});

describe("clampProductPurchaseQuantity", () => {
  const bounds = {
    minQuantity: 10,
    maxQuantity: 20,
    purchasable: true,
  };

  it("sube al mínimo", () => {
    expect(clampProductPurchaseQuantity(5, bounds)).toBe(10);
  });

  it("baja al máximo", () => {
    expect(clampProductPurchaseQuantity(25, bounds)).toBe(20);
  });
});

describe("mergeProductPurchaseQuantity", () => {
  const bounds = {
    minQuantity: 10,
    maxQuantity: 20,
    purchasable: true,
  };

  it("fusiona y acota al máximo", () => {
    expect(mergeProductPurchaseQuantity(15, 10, bounds)).toBe(20);
  });
});

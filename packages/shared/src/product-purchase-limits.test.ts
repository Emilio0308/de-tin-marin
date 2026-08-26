import { describe, expect, it } from "vitest";
import {
  clampProductDualQuantities,
  clampProductPurchaseQuantity,
  mergeProductPurchaseQuantity,
  productLineNeedBaseUnits,
  resolveAdminProductDualPurchasable,
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

describe("clampProductDualQuantities", () => {
  it("normaliza y acota al stock disponible", () => {
    expect(
      clampProductDualQuantities({
        packageQuantity: 0,
        unitQuantity: 20,
        itemsPerPackage: 12,
        availableBaseUnits: 5,
      }),
    ).toEqual({ packageQuantity: 0, unitQuantity: 5 });
  });

  it("permite residual loose cuando no hay tira completa", () => {
    expect(
      clampProductDualQuantities({
        packageQuantity: 1,
        unitQuantity: 0,
        itemsPerPackage: 12,
        availableBaseUnits: 5,
      }),
    ).toEqual({ packageQuantity: 0, unitQuantity: 5 });
  });
});

describe("productLineNeedBaseUnits", () => {
  it("suma presentaciones y unidades", () => {
    expect(
      productLineNeedBaseUnits({
        packageQuantity: 1,
        unitQuantity: 5,
        itemsPerPackage: 12,
      }),
    ).toBe(17);
  });
});

describe("resolveAdminProductDualPurchasable", () => {
  it("es true con loose residual", () => {
    expect(resolveAdminProductDualPurchasable(5)).toBe(true);
    expect(resolveAdminProductDualPurchasable(0)).toBe(false);
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

  it("modo admin ignora min/max de compra y acota solo por stock", () => {
    const bounds = resolveProductPurchaseBounds({
      productType: "unit",
      itemsPerPackage: 1,
      stockTotalBaseUnits: 5,
      purchaseMinQuantity: 10,
      purchaseMaxQuantity: 100,
      mode: "admin",
    });

    expect(bounds).toEqual({
      minQuantity: 1,
      maxQuantity: 5,
      purchasable: true,
    });
  });

  it("modo admin no comprable si stock es 0", () => {
    const bounds = resolveProductPurchaseBounds({
      productType: "package",
      itemsPerPackage: 4,
      stockTotalBaseUnits: 0,
      purchaseMinQuantity: 10,
      purchaseMaxQuantity: 100,
      mode: "admin",
    });

    expect(bounds).toEqual({
      minQuantity: 1,
      maxQuantity: 1,
      purchasable: false,
    });
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

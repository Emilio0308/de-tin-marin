import { describe, expect, it } from "vitest";
import type { PublicProductDetail } from "@de-tin-marin/validations/public-catalog";
import {
  isProductPurchasable,
  resolveProductMaxQuantity,
  resolveProductPurchaseLimits,
} from "./product-purchase-limits";

const baseProduct: PublicProductDetail = {
  id: "11111111-1111-1111-1111-111111111111",
  sku: "SKU-00123",
  slug: "gomitas-arcoiris",
  name: "Gomitas Arcoíris",
  brand: "Haribo",
  categoryId: "22222222-2222-2222-2222-222222222222",
  categoryName: "Gomitas",
  imageUrl: "https://example.com/gomitas.png",
  finalPrice: 8.5,
  stockTotalBaseUnits: 48,
  stockDisplay: "12 paquetes · 48 unidades",
  itemsPerPackage: 4,
  productType: "package",
  purchaseMinQuantity: 10,
  purchaseMaxQuantity: 100,
  description: null,
  packageLabel: "Paquete x4",
};

describe("resolveProductPurchaseLimits", () => {
  it("acota el máximo por stock y configuración", () => {
    expect(resolveProductMaxQuantity(baseProduct)).toBe(12);
  });

  it("marca no comprable si el stock no alcanza el mínimo", () => {
    expect(
      isProductPurchasable({
        ...baseProduct,
        stockTotalBaseUnits: 8,
        productType: "unit",
        itemsPerPackage: 1,
      }),
    ).toBe(false);
  });

  it("respeta purchaseMinQuantity", () => {
    expect(resolveProductPurchaseLimits(baseProduct).minQuantity).toBe(10);
  });
});

import { describe, expect, it } from "vitest";
import type { PublicProductDetail } from "@de-tin-marin/validations/public-catalog";
import { resolveProductMaxQuantity } from "./product-detail-page.helpers";

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
  description: null,
  productType: "package",
  packageLabel: "Paquete x4",
};

describe("resolveProductMaxQuantity", () => {
  it("calcula paquetes disponibles para productos tipo package", () => {
    expect(resolveProductMaxQuantity(baseProduct)).toBe(12);
  });

  it("usa unidades base para productos unit", () => {
    expect(
      resolveProductMaxQuantity({
        ...baseProduct,
        productType: "unit",
        itemsPerPackage: 1,
        stockTotalBaseUnits: 20,
      }),
    ).toBe(20);
  });
});

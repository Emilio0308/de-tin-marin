import { describe, expect, it } from "vitest";
import type { PublicProductListItem } from "@de-tin-marin/validations/public-catalog";
import {
  createProductCartLine,
  mergeProductCartLine,
  updateStoredProductQuantity,
} from "./cart-lines";
import type { StoredCartLine } from "../repositories/cart.repository";

const baseProduct: PublicProductListItem = {
  id: "p1",
  sku: "SKU-1",
  slug: "producto-1",
  name: "Producto 1",
  brand: null,
  categoryId: "c1",
  categoryName: "Caramelos",
  imageUrl: "/img.png",
  finalPrice: 5,
  stockTotalBaseUnits: 500,
  stockDisplay: "500 u.",
  itemsPerPackage: 10,
  productType: "package",
  purchaseMinQuantity: 10,
  purchaseMaxQuantity: 100,
};

const bounds = {
  minQuantity: 10,
  maxQuantity: 50,
  purchasable: true,
};

describe("cart-lines purchase limits", () => {
  it("createProductCartLine usa purchaseMinQuantity por defecto", () => {
    const line = createProductCartLine(baseProduct);
    expect(line.quantity).toBe(10);
    expect(line.lineTotal).toBe(50);
  });

  it("mergeProductCartLine respeta max al fusionar", () => {
    const existing: StoredCartLine[] = [
      {
        cartLineId: "line-1",
        line: {
          type: "product",
          productId: "p1",
          sku: "SKU-1",
          name: "Producto 1",
          quantity: 45,
          unitPrice: 5,
          lineTotal: 225,
        },
      },
    ];

    const next = mergeProductCartLine(
      existing,
      {
        type: "product",
        productId: "p1",
        sku: "SKU-1",
        name: "Producto 1",
        quantity: 10,
        unitPrice: 5,
        lineTotal: 50,
      },
      bounds,
    );

    expect(next).toHaveLength(1);
    if (next[0]?.line.type === "product") {
      expect(next[0].line.quantity).toBe(50);
      expect(next[0].line.lineTotal).toBe(250);
    }
  });

  it("updateStoredProductQuantity acota al rango válido", () => {
    const lines: StoredCartLine[] = [
      {
        cartLineId: "line-1",
        line: {
          type: "product",
          productId: "p1",
          sku: "SKU-1",
          name: "Producto 1",
          quantity: 20,
          unitPrice: 5,
          lineTotal: 100,
        },
      },
    ];

    const increased = updateStoredProductQuantity(lines, "line-1", 80, bounds);
    if (increased[0]?.line.type === "product") {
      expect(increased[0].line.quantity).toBe(50);
    }

    const decreased = updateStoredProductQuantity(lines, "line-1", 5, bounds);
    if (decreased[0]?.line.type === "product") {
      expect(decreased[0].line.quantity).toBe(10);
    }
  });
});

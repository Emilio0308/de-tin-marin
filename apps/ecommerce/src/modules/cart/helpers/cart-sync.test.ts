import { describe, expect, it } from "vitest";
import type { OrderStockCheckResult } from "@de-tin-marin/shared/check-order-stock";
import type { OrderShoppingCartLine } from "@de-tin-marin/shared/order-cart";
import type { StoredCartLine } from "../repositories/cart.repository";
import {
  detectCartPriceDrift,
  purgeCartLinesByStockAndBounds,
} from "./cart-sync";

const productLine = (
  productId: string,
  unitPrice: number,
  quantity = 1,
): OrderShoppingCartLine => ({
  type: "product",
  productId,
  sku: "SKU",
  name: "Dulce",
  packageQuantity: quantity,
  unitQuantity: 0,
  packagePrice: unitPrice,
  unitPrice,
  lineTotal: unitPrice * quantity,
  imageUrl: null,
});

describe("detectCartPriceDrift", () => {
  it("returns false when prices match", () => {
    const stored: StoredCartLine[] = [
      {
        cartLineId: "a",
        line: productLine("11111111-1111-1111-1111-111111111111", 10),
      },
    ];
    const server = [productLine("11111111-1111-1111-1111-111111111111", 10)];
    expect(detectCartPriceDrift(stored, server)).toBe(false);
  });

  it("returns true when unit price changed", () => {
    const stored: StoredCartLine[] = [
      {
        cartLineId: "a",
        line: productLine("11111111-1111-1111-1111-111111111111", 10),
      },
    ];
    const server = [productLine("11111111-1111-1111-1111-111111111111", 12)];
    expect(detectCartPriceDrift(stored, server)).toBe(true);
  });
});

describe("purgeCartLinesByStockAndBounds", () => {
  it("removes product lines listed in shortages", () => {
    const productId = "11111111-1111-1111-1111-111111111111";
    const otherId = "22222222-2222-2222-2222-222222222222";
    const stored: StoredCartLine[] = [
      { cartLineId: "a", line: productLine(productId, 10) },
      { cartLineId: "b", line: productLine(otherId, 5) },
    ];
    const stock: OrderStockCheckResult = {
      ok: false,
      shortages: [
        {
          kind: "product",
          id: productId,
          sku: "SKU",
          required: 1,
          available: 0,
        },
      ],
    };

    const result = purgeCartLinesByStockAndBounds(stored, stock, {
      a: { minQuantity: 1, maxQuantity: 10, purchasable: true },
      b: { minQuantity: 1, maxQuantity: 10, purchasable: true },
    });

    expect(result.removedCount).toBe(1);
    expect(result.lines).toHaveLength(1);
    expect(result.lines[0]?.cartLineId).toBe("b");
  });

  it("removes unpurchasable product lines", () => {
    const productId = "11111111-1111-1111-1111-111111111111";
    const stored: StoredCartLine[] = [
      { cartLineId: "a", line: productLine(productId, 10) },
    ];

    const result = purgeCartLinesByStockAndBounds(
      stored,
      { ok: true },
      {
        a: { minQuantity: 1, maxQuantity: 1, purchasable: false },
      },
    );

    expect(result.removedCount).toBe(1);
    expect(result.lines).toHaveLength(0);
  });
});

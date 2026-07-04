import { describe, expect, it } from "vitest";
import {
  buildShoppingCart,
  canTransitionOrderStatus,
  computeOrderTotals,
  formatOrderNumber,
} from "./order-cart";

const productsById = new Map([
  ["p1", { id: "p1", sku: "SKU-1", name: "Gomitas", unitPrice: 8 }],
  ["p2", { id: "p2", sku: "SKU-2", name: "Chocolates", unitPrice: 2 }],
]);

describe("buildShoppingCart", () => {
  it("freezes product and bundle lines with totals", () => {
    const cart = buildShoppingCart({
      productsById,
      lines: [
        { type: "product", productId: "p1", quantity: 2 },
        {
          type: "bundle",
          bundleId: "b1",
          name: "Sorpresa",
          quantity: 25,
          serviceFee: 50,
          components: [
            { productId: "p1", quantityPerUnit: 1 },
            { productId: "p2", quantityPerUnit: 1 },
          ],
        },
      ],
    });

    expect(cart.lines[0]).toMatchObject({
      type: "product",
      lineTotal: 16,
    });
    expect(cart.lines[1]).toMatchObject({
      type: "bundle",
      lineTotal: 1500,
      components: [
        { totalQuantity: 25, unitPrice: 8 },
        { totalQuantity: 25, unitPrice: 2 },
      ],
    });
  });
});

describe("computeOrderTotals", () => {
  it("sums lines with shipping and discount", () => {
    const cart = buildShoppingCart({
      productsById,
      lines: [{ type: "product", productId: "p1", quantity: 1 }],
    });

    expect(
      computeOrderTotals(cart, { shippingTotal: 5, discountTotal: 1 }),
    ).toEqual({
      subtotal: 8,
      discountTotal: 1,
      shippingTotal: 5,
      total: 12,
    });
  });
});

describe("canTransitionOrderStatus", () => {
  it("allows pending_payment to cancelled", () => {
    expect(canTransitionOrderStatus("pending_payment", "cancelled")).toBe(true);
  });

  it("rejects ready to paid", () => {
    expect(canTransitionOrderStatus("ready", "paid")).toBe(false);
  });
});

describe("formatOrderNumber", () => {
  it("formats daily sequence", () => {
    expect(formatOrderNumber(42, new Date("2026-07-03T12:00:00Z"))).toBe(
      "TM-20260703-0042",
    );
  });
});

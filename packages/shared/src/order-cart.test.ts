import { describe, expect, it } from "vitest";
import {
  buildShoppingCart,
  canTransitionOrderStatus,
  computeOrderTotals,
  deriveAdjustmentsFromFinalPrice,
  formatOrderNumber,
  getBundleLineContainerUnitPrice,
  nextLogisticStatus,
  normalizeProductLineQuantities,
} from "./order-cart";

const productsById = new Map([
  [
    "p1",
    {
      id: "p1",
      sku: "SKU-1",
      name: "Gomitas",
      unitPrice: 8,
      presentationPrice: 8,
      itemsPerPackage: 1,
    },
  ],
  [
    "p2",
    {
      id: "p2",
      sku: "SKU-2",
      name: "Chocolates",
      unitPrice: 2,
      presentationPrice: 2,
      itemsPerPackage: 1,
    },
  ],
  [
    "p-pkg",
    {
      id: "p-pkg",
      sku: "CHI-12",
      name: "Chizitos",
      unitPrice: 0.55,
      presentationPrice: 6.5,
      itemsPerPackage: 12,
    },
  ],
]);

describe("normalizeProductLineQuantities", () => {
  it("rolls units into packages when unitQuantity >= ipp", () => {
    expect(normalizeProductLineQuantities(0, 12, 12)).toEqual({
      packageQuantity: 1,
      unitQuantity: 0,
    });
    expect(normalizeProductLineQuantities(1, 25, 12)).toEqual({
      packageQuantity: 3,
      unitQuantity: 1,
    });
  });

  it("leaves mixed qty under ipp untouched", () => {
    expect(normalizeProductLineQuantities(1, 5, 12)).toEqual({
      packageQuantity: 1,
      unitQuantity: 5,
    });
  });
});

describe("buildShoppingCart", () => {
  it("freezes product and bundle lines with container totals", () => {
    const cart = buildShoppingCart({
      productsById,
      lines: [
        {
          type: "product",
          productId: "p1",
          packageQuantity: 2,
          unitQuantity: 0,
        },
        {
          type: "bundle",
          bundleId: "b1",
          name: "Sorpresa",
          quantity: 25,
          container: {
            containerId: "c1",
            sku: "ENV-50",
            name: "Caja mediana",
            unitPrice: 50,
          },
          components: [
            { productId: "p1", quantityPerUnit: 1 },
            { productId: "p2", quantityPerUnit: 1 },
          ],
        },
      ],
    });

    expect(cart.lines[0]).toMatchObject({
      type: "product",
      packageQuantity: 2,
      unitQuantity: 0,
      packagePrice: 8,
      unitPrice: 8,
      lineTotal: 16,
    });
    expect(cart.lines[1]).toMatchObject({
      type: "bundle",
      lineTotal: 1500,
      container: { unitPrice: 50 },
      components: [
        { totalQuantity: 25, unitPrice: 8 },
        { totalQuantity: 25, unitPrice: 2 },
      ],
    });
  });

  it("prices dual package + unit and normalizes", () => {
    const cart = buildShoppingCart({
      productsById,
      lines: [
        {
          type: "product",
          productId: "p-pkg",
          packageQuantity: 1,
          unitQuantity: 5,
        },
        {
          type: "product",
          productId: "p-pkg",
          packageQuantity: 0,
          unitQuantity: 12,
        },
      ],
    });

    expect(cart.lines[0]).toMatchObject({
      packageQuantity: 1,
      unitQuantity: 5,
      packagePrice: 6.5,
      unitPrice: 0.55,
      lineTotal: 9.25,
    });
    expect(cart.lines[1]).toMatchObject({
      packageQuantity: 1,
      unitQuantity: 0,
      lineTotal: 6.5,
    });
  });

  it("reads legacy serviceFee via helper", () => {
    const legacyLine = {
      type: "bundle" as const,
      bundleId: "b1",
      name: "Legacy",
      quantity: 2,
      serviceFee: 5,
      lineTotal: 20,
      components: [],
    };

    expect(getBundleLineContainerUnitPrice(legacyLine)).toBe(5);
  });
});

describe("computeOrderTotals", () => {
  it("sums lines with shipping and discount", () => {
    const cart = buildShoppingCart({
      productsById,
      lines: [
        {
          type: "product",
          productId: "p1",
          packageQuantity: 1,
          unitQuantity: 0,
        },
      ],
    });

    expect(
      computeOrderTotals(cart, { shippingTotal: 5, discountTotal: 1 }),
    ).toEqual({
      subtotal: 8,
      discountTotal: 1,
      surchargeTotal: 0,
      shippingTotal: 5,
      total: 12,
    });
  });

  it("adds surcharge to total", () => {
    const cart = buildShoppingCart({
      productsById,
      lines: [
        {
          type: "product",
          productId: "p1",
          packageQuantity: 1,
          unitQuantity: 0,
        },
      ],
    });

    expect(
      computeOrderTotals(cart, {
        shippingTotal: 5,
        discountTotal: 0,
        surchargeTotal: 20,
      }),
    ).toEqual({
      subtotal: 8,
      discountTotal: 0,
      surchargeTotal: 20,
      shippingTotal: 5,
      total: 33,
    });
  });
});

describe("deriveAdjustmentsFromFinalPrice", () => {
  it("puts shortfall in discount_total", () => {
    expect(
      deriveAdjustmentsFromFinalPrice({
        subtotal: 370,
        shippingTotal: 10,
        finalTotal: 370,
      }),
    ).toEqual({ discountTotal: 10, surchargeTotal: 0 });
  });

  it("puts surplus in surcharge_total", () => {
    expect(
      deriveAdjustmentsFromFinalPrice({
        subtotal: 370,
        shippingTotal: 10,
        finalTotal: 400,
      }),
    ).toEqual({ discountTotal: 0, surchargeTotal: 20 });
  });

  it("clears both when final equals base", () => {
    expect(
      deriveAdjustmentsFromFinalPrice({
        subtotal: 370,
        shippingTotal: 10,
        finalTotal: 380,
      }),
    ).toEqual({ discountTotal: 0, surchargeTotal: 0 });
  });
});

describe("canTransitionOrderStatus", () => {
  it("allows pending_payment to cancelled", () => {
    expect(canTransitionOrderStatus("pending_payment", "cancelled")).toBe(true);
  });

  it("rejects ready to paid", () => {
    expect(canTransitionOrderStatus("ready", "paid")).toBe(false);
  });

  it("routes ready by fulfillment method", () => {
    expect(canTransitionOrderStatus("ready", "awaiting_pickup", "pickup")).toBe(
      true,
    );
    expect(canTransitionOrderStatus("ready", "in_transit", "pickup")).toBe(
      false,
    );
    expect(canTransitionOrderStatus("ready", "in_transit", "delivery")).toBe(
      true,
    );
    expect(
      canTransitionOrderStatus("ready", "in_transit", "pickup_point"),
    ).toBe(true);
    expect(
      canTransitionOrderStatus("ready", "awaiting_pickup", "delivery"),
    ).toBe(false);
    expect(canTransitionOrderStatus("ready", "delivered", "delivery")).toBe(
      false,
    );
  });

  it("allows logistic statuses to delivered or cancelled", () => {
    expect(
      canTransitionOrderStatus("awaiting_pickup", "delivered", "pickup"),
    ).toBe(true);
    expect(
      canTransitionOrderStatus("in_transit", "delivered", "delivery"),
    ).toBe(true);
    expect(
      canTransitionOrderStatus("awaiting_pickup", "cancelled", "pickup"),
    ).toBe(true);
    expect(
      canTransitionOrderStatus("in_transit", "cancelled", "delivery"),
    ).toBe(true);
  });

  it("nextLogisticStatus maps method", () => {
    expect(nextLogisticStatus("pickup")).toBe("awaiting_pickup");
    expect(nextLogisticStatus("delivery")).toBe("in_transit");
    expect(nextLogisticStatus("pickup_point")).toBe("in_transit");
  });
});

describe("formatOrderNumber", () => {
  it("formats daily sequence", () => {
    expect(formatOrderNumber(42, new Date("2026-07-03T12:00:00Z"))).toBe(
      "TM-20260703-0042",
    );
  });
});

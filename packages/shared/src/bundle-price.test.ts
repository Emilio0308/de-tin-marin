import { describe, expect, it } from "vitest";
import { computeBundleTotal } from "./bundle-price";

describe("computeBundleTotal", () => {
  it("calculates pack premium total (DECISIONS #6)", () => {
    const result = computeBundleTotal({
      serviceFee: 30,
      quantity: 20,
      items: [
        { unitNetPrice: 1, unitsPerPerson: 1 },
        { unitNetPrice: 2, unitsPerPerson: 1 },
      ],
    });

    expect(result.itemsSubtotal).toBe(3);
    expect(result.total).toBe(90);
  });

  it("returns zero total when no items and zero fee", () => {
    const result = computeBundleTotal({
      serviceFee: 0,
      quantity: 10,
      items: [],
    });

    expect(result.itemsSubtotal).toBe(0);
    expect(result.total).toBe(0);
  });
});

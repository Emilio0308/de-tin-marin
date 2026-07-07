import { describe, expect, it } from "vitest";
import { computeBundleTotal } from "./bundle-price";

describe("computeBundleTotal", () => {
  it("calculates pack premium total with container per sorpresa (DECISIONS #6)", () => {
    const result = computeBundleTotal({
      containerNetPrice: 1.5,
      quantity: 20,
      items: [
        { unitNetPrice: 1, unitsPerPerson: 1 },
        { unitNetPrice: 2, unitsPerPerson: 1 },
      ],
    });

    expect(result.itemsSubtotal).toBe(3);
    expect(result.containerSubtotal).toBe(30);
    expect(result.total).toBe(90);
  });

  it("returns zero total when no items and zero container price", () => {
    const result = computeBundleTotal({
      containerNetPrice: 0,
      quantity: 10,
      items: [],
    });

    expect(result.itemsSubtotal).toBe(0);
    expect(result.containerSubtotal).toBe(0);
    expect(result.total).toBe(0);
  });
});

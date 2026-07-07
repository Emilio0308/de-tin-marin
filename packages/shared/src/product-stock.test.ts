import { describe, expect, it } from "vitest";
import {
  computeTotalBaseUnits,
  deductBaseUnits,
  normalizeProductStock,
} from "./product-stock";

describe("normalizeProductStock", () => {
  it("converts excess loose units into sealed packages", () => {
    expect(normalizeProductStock(2, 25, 10)).toEqual({
      sealedPackages: 4,
      looseBaseUnits: 5,
    });
  });
});

describe("deductBaseUnits", () => {
  it("consumes loose first then opens sealed packages (Lay's 25 of 50)", () => {
    const result = deductBaseUnits(5, 0, 10, 25);
    expect(result).toEqual({ sealedPackages: 2, looseBaseUnits: 5 });
    expect(computeTotalBaseUnits(2, 5, 10)).toBe(25);
  });

  it("returns INSUFFICIENT_STOCK when need exceeds available", () => {
    expect(deductBaseUnits(1, 0, 10, 15)).toBe("INSUFFICIENT_STOCK");
  });
});

describe("computeTotalBaseUnits", () => {
  it("sums sealed packages and loose units", () => {
    expect(computeTotalBaseUnits(5, 0, 10)).toBe(50);
  });
});

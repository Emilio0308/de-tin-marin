import { describe, expect, it } from "vitest";
import {
  buildPricesFromNetPrice,
  buildPricesFromPackageNetPrice,
} from "./prices";

describe("buildPricesFromPackageNetPrice", () => {
  it("builds coherent normal and unit prices for a package of 10", () => {
    const prices = buildPricesFromPackageNetPrice(6, 10);
    expect(prices.normal.netPrice).toBe(6);
    expect(prices.unit.netPrice).toBe(0.6);
    expect(prices.unit.netPrice * 10).toBeCloseTo(prices.normal.netPrice, 2);
  });

  it("keeps normal and unit coherent when package price does not divide evenly", () => {
    const prices = buildPricesFromPackageNetPrice(1, 12);
    expect(prices.unit.netPrice * 12).toBeCloseTo(prices.normal.netPrice, 2);
  });

  it("sets identical blocks when itemsPerPackage is 1", () => {
    const prices = buildPricesFromPackageNetPrice(0.6, 1);
    expect(prices.normal).toEqual(prices.unit);
  });
});

describe("buildPricesFromNetPrice", () => {
  it("matches package price with one item per package", () => {
    const legacy = buildPricesFromNetPrice(1.18);
    const modern = buildPricesFromPackageNetPrice(1.18, 1);
    expect(legacy).toEqual(modern);
  });
});

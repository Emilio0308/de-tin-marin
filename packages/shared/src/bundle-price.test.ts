import { describe, expect, it } from "vitest";
import {
  computeBundlePerSurprisePrice,
  computeBundleTotal,
  normalizeBundlePrice,
} from "./bundle-price";

describe("normalizeBundlePrice", () => {
  it("ceil al múltiplo de 0.5 superior", () => {
    expect(normalizeBundlePrice(10)).toBe(10);
    expect(normalizeBundlePrice(10.01)).toBe(10.5);
    expect(normalizeBundlePrice(10.15)).toBe(10.5);
    expect(normalizeBundlePrice(10.5)).toBe(10.5);
    expect(normalizeBundlePrice(10.51)).toBe(11);
  });

  it("respeta step configurable", () => {
    expect(normalizeBundlePrice(10.15, 1)).toBe(11);
    expect(normalizeBundlePrice(10, 1)).toBe(10);
  });

  it("retorna 0 para raw 0", () => {
    expect(normalizeBundlePrice(0)).toBe(0);
  });
});

describe("computeBundlePerSurprisePrice", () => {
  it("suma envase y dulces por sorpresa", () => {
    const result = computeBundlePerSurprisePrice({
      containerNetPrice: 1.5,
      items: [
        { unitNetPrice: 1, unitsPerPerson: 1 },
        { unitNetPrice: 2, unitsPerPerson: 1 },
      ],
    });

    expect(result.itemsSubtotal).toBe(3);
    expect(result.rawPerSurprisePrice).toBe(4.5);
    expect(result.normalizedPerSurprisePrice).toBe(4.5);
  });

  it("normaliza raw con centavos irregulares", () => {
    const result = computeBundlePerSurprisePrice({
      containerNetPrice: 1.5,
      items: [{ unitNetPrice: 2.33, unitsPerPerson: 2 }],
    });

    expect(result.rawPerSurprisePrice).toBe(6.16);
    expect(result.normalizedPerSurprisePrice).toBe(6.5);
  });
});

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
    expect(result.rawPerSurprisePrice).toBe(4.5);
    expect(result.normalizedPerSurprisePrice).toBe(4.5);
    expect(result.lineTotal).toBe(90);
    expect(result.normalizedLineTotal).toBe(90);
    expect(result.total).toBe(90);
  });

  it("escala normalizedLineTotal con quantity", () => {
    const result = computeBundleTotal({
      containerNetPrice: 1.5,
      quantity: 20,
      items: [{ unitNetPrice: 4.33, unitsPerPerson: 1 }],
    });

    expect(result.rawPerSurprisePrice).toBe(5.83);
    expect(result.normalizedPerSurprisePrice).toBe(6);
    expect(result.lineTotal).toBe(116.6);
    expect(result.normalizedLineTotal).toBe(120);
    expect(result.total).toBe(120);
  });

  it("returns zero total when no items and zero container price", () => {
    const result = computeBundleTotal({
      containerNetPrice: 0,
      quantity: 10,
      items: [],
    });

    expect(result.itemsSubtotal).toBe(0);
    expect(result.containerSubtotal).toBe(0);
    expect(result.lineTotal).toBe(0);
    expect(result.normalizedLineTotal).toBe(0);
    expect(result.total).toBe(0);
  });
});

import { describe, expect, it } from "vitest";
import {
  priceNormalSchema,
  pricesSchema,
  pricesSchemaWithCoherence,
} from "./prices";

describe("priceNormalSchema", () => {
  it("accepts valid normal price (Regla 2)", () => {
    const result = priceNormalSchema.safeParse({
      netPrice: 100,
      igv: 18,
      subtotal: 82,
    });
    expect(result.success).toBe(true);
  });

  it("rejects when subtotal + igv != netPrice", () => {
    const result = priceNormalSchema.safeParse({
      netPrice: 100,
      igv: 10,
      subtotal: 82,
    });
    expect(result.success).toBe(false);
  });
});

describe("pricesSchema", () => {
  it("accepts full prices object with normal and unit", () => {
    const result = pricesSchema.safeParse({
      normal: { netPrice: 6, igv: 0.92, subtotal: 5.08 },
      unit: { netPrice: 0.6, igv: 0.09, subtotal: 0.51 },
      suggested: {},
      fantasy: {},
    });
    expect(result.success).toBe(true);
  });
});

describe("pricesSchemaWithCoherence", () => {
  it("rejects when unit × items_per_package diverges from normal", () => {
    const result = pricesSchemaWithCoherence(10).safeParse({
      normal: { netPrice: 6, igv: 0.92, subtotal: 5.08 },
      unit: { netPrice: 0.5, igv: 0.08, subtotal: 0.42 },
      suggested: {},
      fantasy: {},
    });
    expect(result.success).toBe(false);
  });

  it("accepts coherent package and unit prices", () => {
    const result = pricesSchemaWithCoherence(10).safeParse({
      normal: { netPrice: 6, igv: 0.92, subtotal: 5.08 },
      unit: { netPrice: 0.6, igv: 0.09, subtotal: 0.51 },
      suggested: {},
      fantasy: {},
    });
    expect(result.success).toBe(true);
  });
});

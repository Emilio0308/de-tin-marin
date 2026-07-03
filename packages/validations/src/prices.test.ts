import { describe, expect, it } from "vitest";
import { priceNormalSchema, pricesSchema } from "./prices";

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
  it("accepts full prices object", () => {
    const result = pricesSchema.safeParse({
      normal: { netPrice: 50, igv: 9, subtotal: 41 },
      suggested: {},
      fantasy: {},
    });
    expect(result.success).toBe(true);
  });
});

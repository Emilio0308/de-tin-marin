import { describe, expect, it } from "vitest";
import { createBundleInputSchema } from "./bundle";

const validProductId = "550e8400-e29b-41d4-a716-446655440000";

describe("createBundleInputSchema", () => {
  it("accepts valid bundle input", () => {
    const result = createBundleInputSchema.safeParse({
      name: "Pack Premium",
      serviceFee: 30,
      quantity: 20,
      isActive: true,
      items: [{ productId: validProductId, unitsPerPerson: 1 }],
    });
    expect(result.success).toBe(true);
  });

  it("rejects negative serviceFee", () => {
    const result = createBundleInputSchema.safeParse({
      name: "Pack",
      serviceFee: -1,
      quantity: 1,
      isActive: true,
      items: [{ productId: validProductId, unitsPerPerson: 1 }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects quantity below 1", () => {
    const result = createBundleInputSchema.safeParse({
      name: "Pack",
      serviceFee: 0,
      quantity: 0,
      isActive: true,
      items: [{ productId: validProductId, unitsPerPerson: 1 }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty items array", () => {
    const result = createBundleInputSchema.safeParse({
      name: "Pack",
      serviceFee: 0,
      quantity: 1,
      isActive: true,
      items: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects unitsPerPerson below 1", () => {
    const result = createBundleInputSchema.safeParse({
      name: "Pack",
      serviceFee: 0,
      quantity: 1,
      isActive: true,
      items: [{ productId: validProductId, unitsPerPerson: 0 }],
    });
    expect(result.success).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import { createBundleInputSchema } from "./bundle";

const base = {
  name: "Pack",
  containerId: "550e8400-e29b-41d4-a716-446655440000",
  quantity: 10,
  isActive: true,
  customizationMinProducts: 2,
  customizationMaxProducts: 5,
  items: [
    { productId: "550e8400-e29b-41d4-a716-446655440001" },
    { productId: "550e8400-e29b-41d4-a716-446655440002" },
  ],
};

describe("createBundleInputSchema", () => {
  it("requires containerId instead of serviceFee", () => {
    const result = createBundleInputSchema.safeParse(base);
    expect(result.success).toBe(true);
  });

  it("rejects missing containerId", () => {
    const withoutContainer = {
      name: base.name,
      quantity: base.quantity,
      isActive: base.isActive,
      customizationMinProducts: base.customizationMinProducts,
      customizationMaxProducts: base.customizationMaxProducts,
      items: base.items,
    };
    const result = createBundleInputSchema.safeParse(withoutContainer);
    expect(result.success).toBe(false);
  });

  it("defaults customization limits to 8/20", () => {
    const result = createBundleInputSchema.safeParse({
      name: "Pack",
      containerId: "550e8400-e29b-41d4-a716-446655440000",
      quantity: 10,
      isActive: true,
      items: Array.from({ length: 8 }, (_, index) => ({
        productId: `550e8400-e29b-41d4-a716-${String(index + 1).padStart(12, "0")}`,
      })),
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.customizationMinProducts).toBe(8);
      expect(result.data.customizationMaxProducts).toBe(20);
    }
  });

  it("rejects max < min", () => {
    const result = createBundleInputSchema.safeParse({
      ...base,
      customizationMinProducts: 10,
      customizationMaxProducts: 4,
    });
    expect(result.success).toBe(false);
  });

  it("rejects items below customization min", () => {
    const result = createBundleInputSchema.safeParse({
      ...base,
      customizationMinProducts: 3,
      customizationMaxProducts: 5,
      items: [
        { productId: "550e8400-e29b-41d4-a716-446655440001" },
        { productId: "550e8400-e29b-41d4-a716-446655440002" },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("rejects items above customization max", () => {
    const result = createBundleInputSchema.safeParse({
      ...base,
      customizationMinProducts: 1,
      customizationMaxProducts: 2,
      items: [
        { productId: "550e8400-e29b-41d4-a716-446655440001" },
        { productId: "550e8400-e29b-41d4-a716-446655440002" },
        { productId: "550e8400-e29b-41d4-a716-446655440003" },
      ],
    });
    expect(result.success).toBe(false);
  });
});

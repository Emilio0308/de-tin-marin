import { describe, expect, it } from "vitest";
import { createBundleInputSchema } from "./bundle";

describe("createBundleInputSchema", () => {
  it("requires containerId instead of serviceFee", () => {
    const result = createBundleInputSchema.safeParse({
      name: "Pack",
      containerId: "550e8400-e29b-41d4-a716-446655440000",
      quantity: 10,
      isActive: true,
      items: [{ productId: "550e8400-e29b-41d4-a716-446655440001" }],
    });

    expect(result.success).toBe(true);
  });

  it("rejects missing containerId", () => {
    const result = createBundleInputSchema.safeParse({
      name: "Pack",
      quantity: 10,
      isActive: true,
      items: [{ productId: "550e8400-e29b-41d4-a716-446655440001" }],
    });

    expect(result.success).toBe(false);
  });
});

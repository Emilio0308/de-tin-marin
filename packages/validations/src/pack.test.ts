import { describe, expect, it } from "vitest";
import { createPackInputSchema } from "./pack";

describe("createPackInputSchema", () => {
  it("acepta input válido", () => {
    const result = createPackInputSchema.safeParse({
      sku: "COMBO-1",
      name: "Combo 1",
      normalNetPrice: 11,
      items: [
        {
          productId: "11111111-1111-1111-1111-111111111111",
          packageQuantity: 2,
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("exige al menos un item", () => {
    const result = createPackInputSchema.safeParse({
      sku: "COMBO-1",
      name: "Combo 1",
      normalNetPrice: 11,
      items: [],
    });
    expect(result.success).toBe(false);
  });

  it("rechaza max < min", () => {
    const result = createPackInputSchema.safeParse({
      sku: "COMBO-1",
      name: "Combo 1",
      normalNetPrice: 11,
      purchaseMinQuantity: 5,
      purchaseMaxQuantity: 2,
      items: [
        {
          productId: "11111111-1111-1111-1111-111111111111",
          packageQuantity: 1,
        },
      ],
    });
    expect(result.success).toBe(false);
  });
});

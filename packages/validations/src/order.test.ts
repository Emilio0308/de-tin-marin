import { describe, expect, it } from "vitest";
import { createOrderInputSchema } from "./order";

describe("createOrderInputSchema", () => {
  it("requires delivery address when method is delivery", () => {
    const result = createOrderInputSchema.safeParse({
      contact: {
        name: "María",
        lastName: "García",
        phone: "999888777",
        email: "maria@test.com",
      },
      fulfillment: { method: "delivery" },
      lines: [{ type: "product", productId: crypto.randomUUID(), quantity: 1 }],
    });

    expect(result.success).toBe(false);
  });

  it("accepts pickup without delivery address", () => {
    const result = createOrderInputSchema.safeParse({
      contact: {
        name: "María",
        lastName: "García",
        phone: "999888777",
        email: "maria@test.com",
      },
      fulfillment: { method: "pickup" },
      lines: [{ type: "product", productId: crypto.randomUUID(), quantity: 1 }],
    });

    expect(result.success).toBe(true);
  });
});

import { describe, expect, it } from "vitest";
import { createGuestOrderInputSchema } from "./checkout";

const productId = "00000000-0000-4000-8000-000000000001";
const bundleId = "11111111-1111-4111-8111-111111111111";

const baseGuestOrder = {
  contact: {
    name: "María",
    lastName: "García",
    phone: "999888777",
    email: "maria@test.com",
  },
  fulfillment: {
    method: "delivery" as const,
    deliveryAddress: {
      recipientName: "María García",
      line1: "Av. Grau 123",
      district: "Piura",
      city: "Piura",
      province: "Piura",
      reference: "Frente al parque",
      phone: "999888777",
    },
    notes: null,
  },
  lines: [{ type: "product" as const, productId, quantity: 1 }],
  shippingTotal: 8,
  discountTotal: 0,
  mapPin: { lat: -5.1783, lng: -80.6328 },
};

describe("createGuestOrderInputSchema", () => {
  it("acepta orden guest válida con mapPin", () => {
    const result = createGuestOrderInputSchema.safeParse(baseGuestOrder);
    expect(result.success).toBe(true);
  });

  it("rechaza delivery sin dirección", () => {
    const result = createGuestOrderInputSchema.safeParse({
      ...baseGuestOrder,
      fulfillment: { method: "delivery" },
    });
    expect(result.success).toBe(false);
  });

  it("acepta línea bundle con componentes", () => {
    const result = createGuestOrderInputSchema.safeParse({
      ...baseGuestOrder,
      lines: [
        {
          type: "bundle",
          bundleId,
          quantity: 10,
          components: [
            { productId, quantityPerUnit: 1 },
            {
              productId: "00000000-0000-4000-8000-000000000002",
              quantityPerUnit: 1,
            },
            {
              productId: "00000000-0000-4000-8000-000000000003",
              quantityPerUnit: 1,
            },
            {
              productId: "00000000-0000-4000-8000-000000000004",
              quantityPerUnit: 1,
            },
            {
              productId: "00000000-0000-4000-8000-000000000005",
              quantityPerUnit: 1,
            },
          ],
        },
      ],
    });
    expect(result.success).toBe(true);
  });
});

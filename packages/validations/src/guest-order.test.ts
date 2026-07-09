import { describe, expect, it } from "vitest";
import {
  getGuestOrderInputSchema,
  guestOrderDetailSchema,
} from "./guest-order";

describe("getGuestOrderInputSchema", () => {
  it("acepta orderNumber y email válidos", () => {
    const parsed = getGuestOrderInputSchema.safeParse({
      orderNumber: "TM-20250707-0001",
      email: "cliente@example.com",
    });

    expect(parsed.success).toBe(true);
  });

  it("rechaza email inválido", () => {
    const parsed = getGuestOrderInputSchema.safeParse({
      orderNumber: "TM-20250707-0001",
      email: "no-email",
    });

    expect(parsed.success).toBe(false);
  });
});

describe("guestOrderDetailSchema", () => {
  it("parsea el DTO allowlist del RPC", () => {
    const parsed = guestOrderDetailSchema.safeParse({
      orderNumber: "TM-20250707-0001",
      status: "pending_payment",
      paymentStatus: "pending",
      subtotal: 10,
      shippingTotal: 8,
      total: 18,
      createdAt: "2025-07-07T12:00:00.000Z",
      fulfillment: {
        method: "delivery",
        deliveryAddress: {
          recipientName: "Ana García",
          line1: "Av. Grau 123",
          district: "Piura",
          city: "Piura",
          province: "Piura",
          reference: null,
          phone: "999888777",
        },
        notes: null,
      },
      shoppingCart: {
        lines: [
          {
            type: "product",
            productId: "00000000-0000-0000-0000-000000000001",
            sku: "SKU-1",
            name: "Gomita",
            quantity: 2,
            unitPrice: 5,
            lineTotal: 10,
          },
        ],
      },
    });

    expect(parsed.success).toBe(true);
  });
});

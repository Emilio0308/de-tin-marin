import { describe, expect, it } from "vitest";
import { parseGuestOrderDto } from "./parse-guest-order-dto";

const validPayload = {
  orderNumber: "TM-20250707-0001",
  status: "pending_payment",
  paymentStatus: "pending",
  subtotal: 10,
  shippingTotal: 8,
  total: 18,
  createdAt: "2025-07-07T12:00:00.000Z",
  fulfillment: {
    method: "delivery" as const,
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
        type: "product" as const,
        productId: "00000000-0000-0000-0000-000000000001",
        sku: "SKU-1",
        name: "Gomita",
        quantity: 2,
        unitPrice: 5,
        lineTotal: 10,
      },
    ],
  },
};

describe("parseGuestOrderDto", () => {
  it("devuelve el DTO cuando el payload es válido", () => {
    expect(parseGuestOrderDto(validPayload)?.orderNumber).toBe(
      "TM-20250707-0001",
    );
  });

  it("devuelve null cuando el payload es inválido", () => {
    expect(parseGuestOrderDto({ orderNumber: "TM-1" })).toBeNull();
  });
});

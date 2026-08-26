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
      lines: [
        {
          type: "product",
          productId: crypto.randomUUID(),
          packageQuantity: 1,
          unitQuantity: 0,
        },
      ],
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
      lines: [
        {
          type: "product",
          productId: crypto.randomUUID(),
          packageQuantity: 1,
          unitQuantity: 0,
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  it("requires pickupPoint when method is pickup_point", () => {
    const result = createOrderInputSchema.safeParse({
      contact: {
        name: "María",
        lastName: "García",
        phone: "999888777",
        email: "maria@test.com",
      },
      fulfillment: { method: "pickup_point" },
      lines: [
        {
          type: "product",
          productId: crypto.randomUUID(),
          packageQuantity: 1,
          unitQuantity: 0,
        },
      ],
    });

    expect(result.success).toBe(false);
  });

  it("accepts pickup_point with snapshot", () => {
    const result = createOrderInputSchema.safeParse({
      contact: {
        name: "María",
        lastName: "García",
        phone: "999888777",
        email: "maria@test.com",
      },
      fulfillment: {
        method: "pickup_point",
        pickupPoint: {
          id: crypto.randomUUID(),
          name: "Real Plaza",
          lat: -5.19,
          lng: -80.63,
          fee: 5,
        },
      },
      lines: [
        {
          type: "product",
          productId: crypto.randomUUID(),
          packageQuantity: 1,
          unitQuantity: 0,
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  it("requires courier snapshot when method is courier", () => {
    const result = createOrderInputSchema.safeParse({
      contact: {
        name: "María",
        lastName: "García",
        phone: "999888777",
        email: "maria@test.com",
      },
      fulfillment: { method: "courier" },
      lines: [
        {
          type: "product",
          productId: crypto.randomUUID(),
          packageQuantity: 1,
          unitQuantity: 0,
        },
      ],
    });

    expect(result.success).toBe(false);
  });

  it("accepts courier with snapshot", () => {
    const result = createOrderInputSchema.safeParse({
      contact: {
        name: "María",
        lastName: "García",
        phone: "999888777",
        email: "maria@test.com",
      },
      fulfillment: {
        method: "courier",
        courier: {
          destination: {
            departmentId: crypto.randomUUID(),
            departmentName: "Piura",
            provinceSlug: "sullana",
            provinceName: "Sullana",
          },
          recipient: {
            dni: "12345678",
            fullName: "María García López",
            agencyAddress: "Olva Courier Av. Principal 123",
          },
        },
      },
      lines: [
        {
          type: "product",
          productId: crypto.randomUUID(),
          packageQuantity: 1,
          unitQuantity: 0,
        },
      ],
      shippingTotal: 0,
    });

    expect(result.success).toBe(true);
  });
});

import { describe, expect, it } from "vitest";
import { shipmentStatusSchema, upsertShipmentInputSchema } from "./shipment";

describe("shipmentStatusSchema", () => {
  it("accepts pending, shipped and delivered", () => {
    expect(shipmentStatusSchema.safeParse("pending").success).toBe(true);
    expect(shipmentStatusSchema.safeParse("shipped").success).toBe(true);
    expect(shipmentStatusSchema.safeParse("delivered").success).toBe(true);
  });

  it("rejects unknown statuses", () => {
    expect(shipmentStatusSchema.safeParse("in_transit").success).toBe(false);
  });
});

describe("upsertShipmentInputSchema", () => {
  it("requires orderId and status", () => {
    const result = upsertShipmentInputSchema.safeParse({
      orderId: crypto.randomUUID(),
      status: "shipped",
      trackingNumber: "TRK-123",
      carrier: "Olva",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid status", () => {
    const result = upsertShipmentInputSchema.safeParse({
      orderId: crypto.randomUUID(),
      status: "cancelled",
    });
    expect(result.success).toBe(false);
  });
});

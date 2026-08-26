import { describe, expect, it } from "vitest";
import { resolveDeliveryFee, resolvePickupPointFee } from "./delivery-fee";

const zones = [
  { district: "Piura", fee: 8, isActive: true },
  { district: "Castilla", fee: 8, isActive: true },
  { district: "26 de Octubre", fee: 10, isActive: true },
];

const activePointId = "11111111-1111-4111-8111-111111111111";
const inactivePointId = "22222222-2222-4222-8222-222222222222";

const points = [
  { id: activePointId, fee: 6, isActive: true },
  { id: inactivePointId, fee: 4, isActive: false },
];

const settings = {
  pickupEnabled: true,
  pickupPointsEnabled: true,
  deliveryEnabled: true,
  courierEnabled: false,
  fallbackFee: 20,
};

describe("resolveDeliveryFee", () => {
  it("returns 0 for pickup", () => {
    expect(resolveDeliveryFee("pickup", "Piura", zones, settings)).toBe(0);
  });

  it("returns 0 for courier", () => {
    expect(resolveDeliveryFee("courier", undefined, zones, settings)).toBe(0);
  });

  it("returns fee for pickup_point from active point", () => {
    expect(
      resolveDeliveryFee(
        "pickup_point",
        undefined,
        zones,
        settings,
        activePointId,
        points,
      ),
    ).toBe(6);
  });

  it("returns 0 for inactive pickup point", () => {
    expect(
      resolveDeliveryFee(
        "pickup_point",
        undefined,
        zones,
        settings,
        inactivePointId,
        points,
      ),
    ).toBe(0);
  });

  it("matches district case-insensitively", () => {
    expect(resolveDeliveryFee("delivery", "  piura ", zones, settings)).toBe(8);
  });

  it("uses fallback when district is unknown", () => {
    expect(
      resolveDeliveryFee("delivery", "Tambo Grande", zones, settings),
    ).toBe(20);
  });

  it("uses fallback when district is empty", () => {
    expect(resolveDeliveryFee("delivery", "", zones, settings)).toBe(20);
  });
});

describe("resolvePickupPointFee", () => {
  it("returns null when point is inactive", () => {
    expect(resolvePickupPointFee(inactivePointId, points)).toBeNull();
  });
});

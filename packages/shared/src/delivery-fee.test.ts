import { describe, expect, it } from "vitest";
import { resolveDeliveryFee } from "./delivery-fee";

const zones = [
  { district: "Piura", fee: 8, isActive: true },
  { district: "Castilla", fee: 8, isActive: true },
  { district: "26 de Octubre", fee: 10, isActive: true },
];

const settings = {
  pickupEnabled: true,
  deliveryEnabled: true,
  fallbackFee: 20,
};

describe("resolveDeliveryFee", () => {
  it("returns 0 for pickup", () => {
    expect(resolveDeliveryFee("pickup", "Piura", zones, settings)).toBe(0);
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

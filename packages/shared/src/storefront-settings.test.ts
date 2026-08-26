import { describe, expect, it } from "vitest";
import {
  applyStorefrontShippingFee,
  assertMinOrderSubtotal,
  getActiveAnnouncement,
  isFreeFulfillmentActive,
  isWithinFreeFulfillmentWindow,
  type StorefrontSettingsSource,
} from "./storefront-settings";

const baseSettings: StorefrontSettingsSource = {
  freeDelivery: false,
  freePickupPoint: false,
  freeFulfillmentStartsAt: null,
  freeFulfillmentEndsAt: null,
  minOrderSubtotal: 0,
  announcementEnabled: false,
  announcementMessage: null,
};

describe("isWithinFreeFulfillmentWindow", () => {
  it("allows when no window is set", () => {
    expect(isWithinFreeFulfillmentWindow(baseSettings)).toBe(true);
  });

  it("rejects before start", () => {
    expect(
      isWithinFreeFulfillmentWindow(
        {
          ...baseSettings,
          freeFulfillmentStartsAt: "2026-08-20T00:00:00.000Z",
        },
        new Date("2026-08-19T23:59:59.000Z"),
      ),
    ).toBe(false);
  });

  it("rejects after end", () => {
    expect(
      isWithinFreeFulfillmentWindow(
        {
          ...baseSettings,
          freeFulfillmentEndsAt: "2026-08-20T00:00:00.000Z",
        },
        new Date("2026-08-20T00:00:01.000Z"),
      ),
    ).toBe(false);
  });
});

describe("isFreeFulfillmentActive / applyStorefrontShippingFee", () => {
  it("zeros delivery fee when free_delivery is on without window", () => {
    const settings = { ...baseSettings, freeDelivery: true };
    expect(isFreeFulfillmentActive(settings, "delivery")).toBe(true);
    expect(applyStorefrontShippingFee(12.5, settings, "delivery")).toBe(0);
  });

  it("keeps pickup_point fee when only free_delivery is on", () => {
    const settings = { ...baseSettings, freeDelivery: true };
    expect(applyStorefrontShippingFee(5, settings, "pickup_point")).toBe(5);
  });

  it("zeros pickup_point fee inside window", () => {
    const settings: StorefrontSettingsSource = {
      ...baseSettings,
      freePickupPoint: true,
      freeFulfillmentStartsAt: "2026-08-01T00:00:00.000Z",
      freeFulfillmentEndsAt: "2026-08-31T23:59:59.000Z",
    };
    expect(
      applyStorefrontShippingFee(
        8,
        settings,
        "pickup_point",
        new Date("2026-08-15T12:00:00.000Z"),
      ),
    ).toBe(0);
  });

  it("does not free courier (already zero base)", () => {
    const settings = { ...baseSettings, freeDelivery: true };
    expect(isFreeFulfillmentActive(settings, "courier")).toBe(false);
  });
});

describe("assertMinOrderSubtotal", () => {
  it("passes when minimum is zero", () => {
    expect(assertMinOrderSubtotal(10, 0)).toEqual({ ok: true });
  });

  it("rejects below minimum", () => {
    expect(assertMinOrderSubtotal(40, 50)).toEqual({
      ok: false,
      error: "ORDER_BELOW_MINIMUM",
      minOrderSubtotal: 50,
    });
  });

  it("accepts at or above minimum", () => {
    expect(assertMinOrderSubtotal(50, 50)).toEqual({ ok: true });
    expect(assertMinOrderSubtotal(60, 50)).toEqual({ ok: true });
  });
});

describe("getActiveAnnouncement", () => {
  it("returns null when disabled or empty", () => {
    expect(getActiveAnnouncement(baseSettings)).toBeNull();
    expect(
      getActiveAnnouncement({
        ...baseSettings,
        announcementEnabled: true,
        announcementMessage: "   ",
      }),
    ).toBeNull();
  });

  it("returns trimmed message when enabled", () => {
    expect(
      getActiveAnnouncement({
        ...baseSettings,
        announcementEnabled: true,
        announcementMessage: "  Envío gratis este finde  ",
      }),
    ).toBe("Envío gratis este finde");
  });
});

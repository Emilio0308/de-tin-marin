import { describe, expect, it } from "vitest";
import { computeFinalPrice, isCampaignActive } from "./final-price";

const activeCampaign = {
  percentage: 20,
  startsAt: "2026-01-01T00:00:00.000Z",
  endsAt: "2026-12-31T23:59:59.999Z",
  isActive: true,
};

const now = new Date("2026-07-01T12:00:00.000Z");

describe("isCampaignActive", () => {
  it("returns false when campaign is null", () => {
    expect(isCampaignActive(null, now)).toBe(false);
  });

  it("returns false when campaign is inactive", () => {
    expect(isCampaignActive({ ...activeCampaign, isActive: false }, now)).toBe(
      false,
    );
  });

  it("returns false when campaign is expired", () => {
    expect(
      isCampaignActive(
        {
          ...activeCampaign,
          endsAt: "2026-06-01T00:00:00.000Z",
        },
        now,
      ),
    ).toBe(false);
  });
});

describe("computeFinalPrice", () => {
  it("returns netPrice when no campaign (Regla 12)", () => {
    expect(computeFinalPrice(100, null, now)).toBe(100);
  });

  it("applies percentage when campaign is active", () => {
    expect(computeFinalPrice(100, activeCampaign, now)).toBe(80);
  });

  it("returns netPrice when campaign is expired", () => {
    expect(
      computeFinalPrice(
        100,
        { ...activeCampaign, endsAt: "2026-06-01T00:00:00.000Z" },
        now,
      ),
    ).toBe(100);
  });

  it("returns netPrice when campaign is inactive", () => {
    expect(
      computeFinalPrice(100, { ...activeCampaign, isActive: false }, now),
    ).toBe(100);
  });
});

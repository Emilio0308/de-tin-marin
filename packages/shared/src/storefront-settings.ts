import type { OrderFulfillmentMethod } from "./delivery-fee";
import { roundMoney } from "./prices";

export type StorefrontSettingsSource = {
  freeDelivery: boolean;
  freePickupPoint: boolean;
  freeFulfillmentStartsAt: string | null;
  freeFulfillmentEndsAt: string | null;
  minOrderSubtotal: number;
  announcementEnabled: boolean;
  announcementMessage: string | null;
};

export function isWithinFreeFulfillmentWindow(
  settings: Pick<
    StorefrontSettingsSource,
    "freeFulfillmentStartsAt" | "freeFulfillmentEndsAt"
  >,
  now: Date = new Date(),
): boolean {
  const start = settings.freeFulfillmentStartsAt
    ? new Date(settings.freeFulfillmentStartsAt)
    : null;
  const end = settings.freeFulfillmentEndsAt
    ? new Date(settings.freeFulfillmentEndsAt)
    : null;

  if (start && Number.isNaN(start.getTime())) return false;
  if (end && Number.isNaN(end.getTime())) return false;
  if (start && now.getTime() < start.getTime()) return false;
  if (end && now.getTime() > end.getTime()) return false;
  return true;
}

export function isFreeFulfillmentActive(
  settings: StorefrontSettingsSource,
  method: OrderFulfillmentMethod,
  now: Date = new Date(),
): boolean {
  if (!isWithinFreeFulfillmentWindow(settings, now)) return false;

  if (method === "delivery") return settings.freeDelivery;
  if (method === "pickup_point") return settings.freePickupPoint;
  return false;
}

export function applyStorefrontShippingFee(
  baseFee: number,
  settings: StorefrontSettingsSource,
  method: OrderFulfillmentMethod,
  now: Date = new Date(),
): number {
  if (isFreeFulfillmentActive(settings, method, now)) {
    return 0;
  }
  return roundMoney(baseFee);
}

export type MinOrderSubtotalResult =
  | { ok: true }
  | { ok: false; error: "ORDER_BELOW_MINIMUM"; minOrderSubtotal: number };

export function assertMinOrderSubtotal(
  subtotal: number,
  minOrderSubtotal: number,
): MinOrderSubtotalResult {
  const minimum = roundMoney(minOrderSubtotal);
  if (minimum <= 0) return { ok: true };
  if (roundMoney(subtotal) + 1e-9 >= minimum) return { ok: true };
  return {
    ok: false,
    error: "ORDER_BELOW_MINIMUM",
    minOrderSubtotal: minimum,
  };
}

export function getActiveAnnouncement(
  settings: StorefrontSettingsSource,
): string | null {
  if (!settings.announcementEnabled) return null;
  const message = settings.announcementMessage?.trim() ?? "";
  return message.length > 0 ? message : null;
}

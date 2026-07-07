import { roundMoney } from "./prices";

export type DeliveryZone = {
  district: string;
  fee: number;
  isActive: boolean;
};

export type DeliverySettings = {
  pickupEnabled: boolean;
  deliveryEnabled: boolean;
  fallbackFee: number;
};

export type OrderFulfillmentMethod = "delivery" | "pickup";

export function normalizeDistrict(value: string): string {
  return value.trim().toLowerCase();
}

export function resolveDeliveryFee(
  method: OrderFulfillmentMethod,
  district: string | undefined,
  zones: DeliveryZone[],
  settings: DeliverySettings,
): number {
  if (method === "pickup") return 0;

  if (!settings.deliveryEnabled) {
    return roundMoney(settings.fallbackFee);
  }

  const normalized = district ? normalizeDistrict(district) : "";
  if (!normalized) {
    return roundMoney(settings.fallbackFee);
  }

  const match = zones.find(
    (zone) => zone.isActive && normalizeDistrict(zone.district) === normalized,
  );

  return roundMoney(match?.fee ?? settings.fallbackFee);
}

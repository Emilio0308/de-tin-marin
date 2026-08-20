import { roundMoney } from "./prices";

export type DeliveryZone = {
  district: string;
  fee: number;
  isActive: boolean;
};

export type PickupPointFeeSource = {
  id: string;
  fee: number;
  isActive: boolean;
};

export type DeliverySettings = {
  pickupEnabled: boolean;
  pickupPointsEnabled: boolean;
  deliveryEnabled: boolean;
  fallbackFee: number;
};

export type OrderFulfillmentMethod = "delivery" | "pickup" | "pickup_point";

export function normalizeDistrict(value: string): string {
  return value.trim().toLowerCase();
}

export function resolvePickupPointFee(
  pickupPointId: string | undefined,
  points: PickupPointFeeSource[],
): number | null {
  if (!pickupPointId) return null;
  const match = points.find(
    (point) => point.isActive && point.id === pickupPointId,
  );
  if (!match) return null;
  return roundMoney(match.fee);
}

export function resolveDeliveryFee(
  method: OrderFulfillmentMethod,
  district: string | undefined,
  zones: DeliveryZone[],
  settings: DeliverySettings,
  pickupPointId?: string,
  points: PickupPointFeeSource[] = [],
): number {
  if (method === "pickup") return 0;

  if (method === "pickup_point") {
    const fee = resolvePickupPointFee(pickupPointId, points);
    return fee ?? 0;
  }

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

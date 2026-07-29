import {
  normalizeDistrict,
  type DeliverySettings,
  type DeliveryZone,
  type OrderFulfillmentMethod,
} from "./delivery-fee";
import { roundMoney } from "./prices";

export const PIURA_DELIVERY_BOUNDS = {
  minLat: -5.25,
  maxLat: -5.05,
  minLng: -80.85,
  maxLng: -80.55,
} as const;

export type MapPin = {
  lat: number;
  lng: number;
};

export type CheckoutDeliveryResult = {
  covered: boolean;
  fee: number;
};

export function isWithinPiuraBounds(lat: number, lng: number): boolean {
  return (
    lat >= PIURA_DELIVERY_BOUNDS.minLat &&
    lat <= PIURA_DELIVERY_BOUNDS.maxLat &&
    lng >= PIURA_DELIVERY_BOUNDS.minLng &&
    lng <= PIURA_DELIVERY_BOUNDS.maxLng
  );
}

export function resolveCheckoutDeliveryFee(
  method: OrderFulfillmentMethod,
  district: string | undefined,
  mapPin: MapPin,
  zones: DeliveryZone[],
  settings: DeliverySettings,
): CheckoutDeliveryResult {
  if (method === "pickup") {
    return { covered: true, fee: 0 };
  }

  if (!settings.deliveryEnabled) {
    return { covered: false, fee: 0 };
  }

  const normalized = district ? normalizeDistrict(district) : "";
  const zoneMatch = zones.find(
    (zone) => zone.isActive && normalizeDistrict(zone.district) === normalized,
  );

  if (zoneMatch) {
    return { covered: true, fee: roundMoney(zoneMatch.fee) };
  }

  if (isWithinPiuraBounds(mapPin.lat, mapPin.lng)) {
    return { covered: true, fee: roundMoney(settings.fallbackFee) };
  }

  return { covered: false, fee: 0 };
}

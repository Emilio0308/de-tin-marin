import {
  normalizeDistrict,
  resolvePickupPointFee,
  type DeliverySettings,
  type DeliveryZone,
  type OrderFulfillmentMethod,
  type PickupPointFeeSource,
} from "./delivery-fee";
import {
  resolveCourierCoverage,
  type CourierDepartmentSource,
} from "./courier-coverage";
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

export type CheckoutFulfillmentResult = {
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

export function resolveCheckoutFulfillmentFee(
  method: OrderFulfillmentMethod,
  district: string | undefined,
  mapPin: MapPin | undefined,
  zones: DeliveryZone[],
  settings: DeliverySettings,
  pickupPointId?: string,
  points: PickupPointFeeSource[] = [],
  courierDepartmentId?: string,
  courierProvinceSlug?: string,
  courierDepartments: CourierDepartmentSource[] = [],
): CheckoutFulfillmentResult {
  if (method === "pickup") {
    return { covered: true, fee: 0 };
  }

  if (method === "courier") {
    const courierResult = resolveCourierCoverage(
      courierDepartmentId,
      courierProvinceSlug,
      courierDepartments,
      settings.courierEnabled,
    );
    return { covered: courierResult.covered, fee: 0 };
  }

  if (method === "pickup_point") {
    if (!settings.pickupPointsEnabled) {
      return { covered: false, fee: 0 };
    }
    const fee = resolvePickupPointFee(pickupPointId, points);
    if (fee === null) {
      return { covered: false, fee: 0 };
    }
    return { covered: true, fee };
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

  if (mapPin && isWithinPiuraBounds(mapPin.lat, mapPin.lng)) {
    return { covered: true, fee: roundMoney(settings.fallbackFee) };
  }

  return { covered: false, fee: 0 };
}

/** @deprecated Use resolveCheckoutFulfillmentFee */
export function resolveCheckoutDeliveryFee(
  method: OrderFulfillmentMethod,
  district: string | undefined,
  mapPin: MapPin,
  zones: DeliveryZone[],
  settings: DeliverySettings,
): CheckoutFulfillmentResult {
  return resolveCheckoutFulfillmentFee(
    method,
    district,
    mapPin,
    zones,
    settings,
  );
}

export type CheckoutDeliveryResult = CheckoutFulfillmentResult;

import type { PickupPointDTO } from "@/modules/delivery/types/delivery.dto";
import type { PickupPointDraft } from "./pickup-points.types";

export const PICKUP_POINT_NAME_MAX_LENGTH = 200;

export const DEFAULT_PICKUP_MAP_PIN = {
  lat: -5.1783,
  lng: -80.6328,
} as const;

export function isValidMapPin(pin: { lat: number; lng: number }): boolean {
  return (
    Number.isFinite(pin.lat) &&
    Number.isFinite(pin.lng) &&
    pin.lat >= -90 &&
    pin.lat <= 90 &&
    pin.lng >= -180 &&
    pin.lng <= 180
  );
}

export function resolveMapPin(pin: { lat: number; lng: number }) {
  return isValidMapPin(pin) ? pin : DEFAULT_PICKUP_MAP_PIN;
}

export function buildDefaultPickupPointDraft(): PickupPointDraft {
  return {
    name: "",
    lat: DEFAULT_PICKUP_MAP_PIN.lat,
    lng: DEFAULT_PICKUP_MAP_PIN.lng,
    fee: 0,
  };
}

export function nextPickupPointSortOrder(points: PickupPointDTO[]): number {
  if (points.length === 0) return 1;
  return Math.max(...points.map((point) => point.sortOrder)) + 1;
}

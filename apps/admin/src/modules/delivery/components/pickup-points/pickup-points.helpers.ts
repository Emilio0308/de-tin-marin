import type { PickupPointDTO } from "@/modules/delivery/types/delivery.dto";
import type { PickupPointDraft } from "./pickup-points.types";

export const PICKUP_POINT_NAME_MAX_LENGTH = 200;

export const DEFAULT_PICKUP_MAP_PIN = {
  lat: -5.1783,
  lng: -80.6328,
} as const;

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

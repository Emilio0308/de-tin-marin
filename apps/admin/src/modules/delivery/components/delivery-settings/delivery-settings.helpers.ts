import type { DeliveryZoneDTO } from "@/modules/delivery/types/delivery.dto";
import type { ZoneDraft } from "./delivery-settings.types";

export const DISTRICT_MAX_LENGTH = 120;

export function buildDefaultZoneDraft(): ZoneDraft {
  return { district: "", fee: 0 };
}

export function nextZoneSortOrder(zones: DeliveryZoneDTO[]): number {
  if (zones.length === 0) return 1;
  return Math.max(...zones.map((zone) => zone.sortOrder)) + 1;
}

export function formatDeliveryPrice(value: number): string {
  return value.toFixed(2);
}

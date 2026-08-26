import "server-only";

import type { StorefrontSettingsSource } from "@de-tin-marin/shared/storefront-settings";
import type { SupabaseConfig } from "@de-tin-marin/db/config";
import { getStorefrontSettingsRepo } from "../repositories/storefront-settings.repository";
import type { StorefrontSettingsDTO } from "../types/storefront-settings.dto";

const DEFAULT_STOREFRONT_SETTINGS: StorefrontSettingsDTO = {
  freeDelivery: false,
  freePickupPoint: false,
  freeFulfillmentStartsAt: null,
  freeFulfillmentEndsAt: null,
  minOrderSubtotal: 0,
  announcementEnabled: false,
  announcementMessage: null,
};

export function toStorefrontSettingsDTO(
  row: NonNullable<Awaited<ReturnType<typeof getStorefrontSettingsRepo>>>,
): StorefrontSettingsDTO {
  return {
    freeDelivery: row.free_delivery,
    freePickupPoint: row.free_pickup_point,
    freeFulfillmentStartsAt: row.free_fulfillment_starts_at,
    freeFulfillmentEndsAt: row.free_fulfillment_ends_at,
    minOrderSubtotal: Number(row.min_order_subtotal),
    announcementEnabled: row.announcement_enabled,
    announcementMessage: row.announcement_message,
  };
}

export function toStorefrontSettingsSource(
  dto: StorefrontSettingsDTO,
): StorefrontSettingsSource {
  return {
    freeDelivery: dto.freeDelivery,
    freePickupPoint: dto.freePickupPoint,
    freeFulfillmentStartsAt: dto.freeFulfillmentStartsAt,
    freeFulfillmentEndsAt: dto.freeFulfillmentEndsAt,
    minOrderSubtotal: dto.minOrderSubtotal,
    announcementEnabled: dto.announcementEnabled,
    announcementMessage: dto.announcementMessage,
  };
}

export async function getStorefrontSettingsService(
  config: SupabaseConfig,
): Promise<StorefrontSettingsDTO> {
  const row = await getStorefrontSettingsRepo(config);
  if (!row) return DEFAULT_STOREFRONT_SETTINGS;
  return toStorefrontSettingsDTO(row);
}

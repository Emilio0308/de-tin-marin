import "server-only";

import { storefrontSettingsSchema } from "@de-tin-marin/validations/storefront-settings";
import type { SupabaseConfig } from "@de-tin-marin/db/config";
import {
  getStorefrontSettingsRepo,
  updateStorefrontSettingsRepo,
} from "../repositories/storefront-settings.repository";
import type { StorefrontSettingsDTO } from "../types/storefront-settings.dto";

function toDTO(
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

export async function getStorefrontSettingsService(
  config: SupabaseConfig,
): Promise<StorefrontSettingsDTO | null> {
  const row = await getStorefrontSettingsRepo(config);
  if (!row) return null;
  return toDTO(row);
}

export async function updateStorefrontSettingsService(
  config: SupabaseConfig,
  raw: unknown,
) {
  const parsed = storefrontSettingsSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: "VALIDATION" as const,
      details: parsed.error.flatten(),
    };
  }

  const data = parsed.data;
  const row = await updateStorefrontSettingsRepo(config, {
    free_delivery: data.freeDelivery,
    free_pickup_point: data.freePickupPoint,
    free_fulfillment_starts_at: data.freeFulfillmentStartsAt ?? null,
    free_fulfillment_ends_at: data.freeFulfillmentEndsAt ?? null,
    min_order_subtotal: data.minOrderSubtotal,
    announcement_enabled: data.announcementEnabled,
    announcement_message: data.announcementMessage ?? null,
  });

  return { ok: true as const, data: toDTO(row) };
}

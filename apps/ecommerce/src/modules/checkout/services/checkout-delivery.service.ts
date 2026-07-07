import "server-only";

import { storeFeatures } from "@de-tin-marin/config/store-features";
import { resolveCheckoutDeliveryFee } from "@de-tin-marin/shared/checkout-coverage";
import type { SupabaseConfig } from "@de-tin-marin/db/config";
import { resolveCheckoutDeliveryFeeInputSchema } from "@de-tin-marin/validations/checkout";
import {
  getDeliverySettingsRepo,
  listActiveDeliveryZonesRepo,
} from "../repositories/delivery.repository";

export async function resolveCheckoutDeliveryFeeService(
  config: SupabaseConfig,
  raw: unknown,
): Promise<
  | { ok: true; data: { fee: number; covered: boolean } }
  | { ok: false; error: "VALIDATION" }
> {
  const parsed = resolveCheckoutDeliveryFeeInputSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "VALIDATION" };

  const [zones, settings] = await Promise.all([
    listActiveDeliveryZonesRepo(config),
    getDeliverySettingsRepo(config),
  ]);

  const result = resolveCheckoutDeliveryFee(
    storeFeatures.pickupEnabled ? "delivery" : "delivery",
    parsed.data.district,
    parsed.data.mapPin,
    zones.map((zone) => ({
      district: zone.district,
      fee: Number(zone.fee),
      isActive: zone.is_active,
    })),
    {
      pickupEnabled: settings?.pickup_enabled ?? storeFeatures.pickupEnabled,
      deliveryEnabled: settings?.delivery_enabled ?? true,
      fallbackFee: Number(settings?.fallback_fee ?? 0),
    },
  );

  return { ok: true, data: result };
}

export async function listCheckoutDeliveryZonesService(config: SupabaseConfig) {
  const zones = await listActiveDeliveryZonesRepo(config);
  return {
    ok: true as const,
    data: zones.map((zone) => ({
      id: zone.id,
      district: zone.district,
      fee: Number(zone.fee),
    })),
  };
}

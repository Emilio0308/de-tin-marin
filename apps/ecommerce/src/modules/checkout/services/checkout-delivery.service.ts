import "server-only";

import { storeFeatures } from "@de-tin-marin/config/store-features";
import { resolveCheckoutDeliveryFee } from "@de-tin-marin/shared/checkout-coverage";
import type { SupabaseConfig } from "@de-tin-marin/db/config";
import { resolveCheckoutDeliveryFeeInputSchema } from "@de-tin-marin/validations/checkout";
import {
  logServerError,
  logServerInfo,
  logServerWarn,
} from "@/shared/errors/server-error";
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
  const scope = "resolveCheckoutDeliveryFeeService";
  const parsed = resolveCheckoutDeliveryFeeInputSchema.safeParse(raw);
  if (!parsed.success) {
    logServerError(scope, {
      message: "VALIDATION",
      issueCount: parsed.error.issues.length,
    });
    return { ok: false, error: "VALIDATION" };
  }

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

  logServerInfo(scope, "resolved", {
    district: parsed.data.district,
    hasMapPin: Boolean(parsed.data.mapPin),
    zoneCount: zones.length,
    fee: result.fee,
    covered: result.covered,
  });

  return { ok: true, data: result };
}

export async function listCheckoutDeliveryZonesService(config: SupabaseConfig) {
  const scope = "listCheckoutDeliveryZonesService";
  logServerInfo(scope, "start");
  const zones = await listActiveDeliveryZonesRepo(config);
  const data = zones.map((zone) => ({
    id: zone.id,
    district: zone.district,
    fee: Number(zone.fee),
  }));

  logServerInfo(scope, "ok", {
    itemCount: data.length,
    districts: data.map((zone) => zone.district),
  });

  if (data.length === 0) {
    logServerWarn(scope, "empty_zones", {
      hint: "Query ok but 0 active delivery_zones — check seed/RLS/is_active in env",
    });
  }

  return {
    ok: true as const,
    data,
  };
}

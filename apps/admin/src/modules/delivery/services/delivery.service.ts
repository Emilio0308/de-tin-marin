import "server-only";

import { resolveDeliveryFee } from "@de-tin-marin/shared/delivery-fee";
import {
  deliverySettingsSchema,
  deliveryZoneInputSchema,
  resolveDeliveryFeeInputSchema,
} from "@de-tin-marin/validations/delivery";
import type { SupabaseConfig } from "@de-tin-marin/db/config";
import {
  deleteDeliveryZoneRepo,
  getDeliverySettingsRepo,
  listDeliveryZonesRepo,
  updateDeliverySettingsRepo,
  upsertDeliveryZoneRepo,
} from "../repositories/delivery.repository";
import { listActivePickupPointsRepo } from "../repositories/pickup-point.repository";
import type {
  DeliverySettingsDTO,
  DeliveryZoneDTO,
} from "../types/delivery.dto";

function toZoneDTO(
  row: Awaited<ReturnType<typeof listDeliveryZonesRepo>>[number],
): DeliveryZoneDTO {
  return {
    id: row.id,
    district: row.district,
    fee: Number(row.fee),
    isActive: row.is_active,
    sortOrder: row.sort_order,
  };
}

function toSettingsDTO(
  row: NonNullable<Awaited<ReturnType<typeof getDeliverySettingsRepo>>>,
): DeliverySettingsDTO {
  return {
    pickupEnabled: row.pickup_enabled,
    pickupPointsEnabled: row.pickup_points_enabled,
    deliveryEnabled: row.delivery_enabled,
    fallbackFee: Number(row.fallback_fee),
  };
}

export async function listDeliveryZonesService(
  config: SupabaseConfig,
): Promise<DeliveryZoneDTO[]> {
  const rows = await listDeliveryZonesRepo(config);
  return rows.map(toZoneDTO);
}

export async function getDeliverySettingsService(
  config: SupabaseConfig,
): Promise<DeliverySettingsDTO | null> {
  const row = await getDeliverySettingsRepo(config);
  if (!row) return null;
  return toSettingsDTO(row);
}

export async function upsertDeliveryZoneService(
  config: SupabaseConfig,
  raw: unknown,
) {
  const parsed = deliveryZoneInputSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: "VALIDATION" as const,
      details: parsed.error.flatten(),
    };
  }

  const data = parsed.data;
  const row = await upsertDeliveryZoneRepo(config, {
    id: data.id,
    district: data.district.trim(),
    fee: data.fee,
    is_active: data.isActive,
    sort_order: data.sortOrder,
  });

  return { ok: true as const, id: row.id };
}

export async function deleteDeliveryZoneService(
  config: SupabaseConfig,
  id: string,
) {
  await deleteDeliveryZoneRepo(config, id);
  return { ok: true as const };
}

export async function updateDeliverySettingsService(
  config: SupabaseConfig,
  raw: unknown,
) {
  const parsed = deliverySettingsSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: "VALIDATION" as const,
      details: parsed.error.flatten(),
    };
  }

  await updateDeliverySettingsRepo(config, {
    pickup_enabled: parsed.data.pickupEnabled,
    pickup_points_enabled: parsed.data.pickupPointsEnabled,
    delivery_enabled: parsed.data.deliveryEnabled,
    fallback_fee: parsed.data.fallbackFee,
  });

  return { ok: true as const };
}

export async function resolveDeliveryFeeService(
  config: SupabaseConfig,
  raw: unknown,
) {
  const parsed = resolveDeliveryFeeInputSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: "VALIDATION" as const,
      details: parsed.error.flatten(),
    };
  }

  const [zones, settings, points] = await Promise.all([
    listDeliveryZonesRepo(config),
    getDeliverySettingsRepo(config),
    listActivePickupPointsRepo(config),
  ]);

  const fee = resolveDeliveryFee(
    parsed.data.method,
    parsed.data.district,
    zones.map((zone) => ({
      district: zone.district,
      fee: Number(zone.fee),
      isActive: zone.is_active,
    })),
    {
      pickupEnabled: settings?.pickup_enabled ?? true,
      pickupPointsEnabled: settings?.pickup_points_enabled ?? true,
      deliveryEnabled: settings?.delivery_enabled ?? true,
      fallbackFee: Number(settings?.fallback_fee ?? 0),
    },
    parsed.data.pickupPointId,
    points.map((point) => ({
      id: point.id,
      fee: Number(point.fee),
      isActive: point.is_active,
    })),
  );

  return { ok: true as const, fee };
}

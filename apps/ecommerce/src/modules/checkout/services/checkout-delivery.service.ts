import "server-only";

import { resolveCheckoutFulfillmentFee } from "@de-tin-marin/shared/checkout-coverage";
import { listEnabledCheckoutCourierDepartments } from "@de-tin-marin/shared/courier-coverage";
import { applyStorefrontShippingFee } from "@de-tin-marin/shared/storefront-settings";
import { courierProvinceSchema } from "@de-tin-marin/validations/courier";
import type { SupabaseConfig } from "@de-tin-marin/db/config";
import { resolveCheckoutFulfillmentFeeInputSchema } from "@de-tin-marin/validations/checkout";
import {
  logServerError,
  logServerInfo,
  logServerWarn,
} from "@/shared/errors/server-error";
import {
  getDeliverySettingsRepo,
  listActiveDeliveryZonesRepo,
  listActivePickupPointsRepo,
  listActiveCourierDepartmentsRepo,
} from "../repositories/delivery.repository";
import {
  getStorefrontSettingsService,
  toStorefrontSettingsSource,
} from "@/modules/storefront-settings/services/storefront-settings.service";

function parseCourierProvinces(raw: unknown) {
  if (!Array.isArray(raw)) return [];
  const provinces = [];
  for (const item of raw) {
    const parsed = courierProvinceSchema.safeParse(item);
    if (parsed.success) provinces.push(parsed.data);
  }
  return provinces;
}

export async function listCheckoutPickupPointsService(config: SupabaseConfig) {
  const scope = "listCheckoutPickupPointsService";
  const [settings, points] = await Promise.all([
    getDeliverySettingsRepo(config),
    listActivePickupPointsRepo(config),
  ]);

  if (settings?.pickup_points_enabled === false) {
    logServerInfo(scope, "disabled", { reason: "pickup_points_enabled=false" });
    return { ok: true as const, data: [] };
  }

  const data = points.map((point) => ({
    id: point.id,
    name: point.name,
    lat: Number(point.lat),
    lng: Number(point.lng),
    fee: Number(point.fee),
  }));

  logServerInfo(scope, "ok", { itemCount: data.length });
  if (data.length === 0) {
    logServerWarn(scope, "empty_points", {
      hint: "No active pickup_points — checkout should hide pickup_point option",
    });
  }

  return { ok: true as const, data };
}

export async function listCheckoutCourierDestinationsService(
  config: SupabaseConfig,
) {
  const scope = "listCheckoutCourierDestinationsService";
  const [settings, rows] = await Promise.all([
    getDeliverySettingsRepo(config),
    listActiveCourierDepartmentsRepo(config),
  ]);

  if (settings?.courier_enabled === false) {
    logServerInfo(scope, "disabled", { reason: "courier_enabled=false" });
    return { ok: true as const, data: [] };
  }

  const departments = rows.map((row) => ({
    id: row.id,
    name: row.name,
    isActive: row.is_active,
    provinces: parseCourierProvinces(row.provinces),
  }));

  const data = listEnabledCheckoutCourierDepartments(departments);
  logServerInfo(scope, "ok", { itemCount: data.length });
  return { ok: true as const, data };
}

export async function resolveCheckoutFulfillmentFeeService(
  config: SupabaseConfig,
  raw: unknown,
): Promise<
  | { ok: true; data: { fee: number; covered: boolean } }
  | { ok: false; error: "VALIDATION" }
> {
  const scope = "resolveCheckoutFulfillmentFeeService";
  const parsed = resolveCheckoutFulfillmentFeeInputSchema.safeParse(raw);
  if (!parsed.success) {
    logServerError(scope, {
      message: "VALIDATION",
      issueCount: parsed.error.issues.length,
    });
    return { ok: false, error: "VALIDATION" };
  }

  const [zones, settings, points, courierDepartments, storefront] =
    await Promise.all([
      listActiveDeliveryZonesRepo(config),
      getDeliverySettingsRepo(config),
      listActivePickupPointsRepo(config),
      listActiveCourierDepartmentsRepo(config),
      getStorefrontSettingsService(config),
    ]);

  const courierDepartmentSources = courierDepartments.map((row) => ({
    id: row.id,
    name: row.name,
    isActive: row.is_active,
    provinces: parseCourierProvinces(row.provinces),
  }));

  const result = resolveCheckoutFulfillmentFee(
    parsed.data.method,
    parsed.data.district,
    parsed.data.mapPin,
    zones.map((zone) => ({
      district: zone.district,
      fee: Number(zone.fee),
      isActive: zone.is_active,
    })),
    {
      pickupEnabled: settings?.pickup_enabled ?? false,
      pickupPointsEnabled: settings?.pickup_points_enabled ?? true,
      deliveryEnabled: settings?.delivery_enabled ?? true,
      courierEnabled: settings?.courier_enabled ?? false,
      fallbackFee: Number(settings?.fallback_fee ?? 0),
    },
    parsed.data.pickupPointId,
    points.map((point) => ({
      id: point.id,
      fee: Number(point.fee),
      isActive: point.is_active,
    })),
    parsed.data.departmentId,
    parsed.data.provinceSlug,
    courierDepartmentSources,
  );

  const fee = applyStorefrontShippingFee(
    result.fee,
    toStorefrontSettingsSource(storefront),
    parsed.data.method,
  );

  logServerInfo(scope, "resolved", {
    method: parsed.data.method,
    pickupPointId: parsed.data.pickupPointId,
    district: parsed.data.district,
    hasMapPin: Boolean(parsed.data.mapPin),
    baseFee: result.fee,
    fee,
    covered: result.covered,
  });

  return { ok: true, data: { fee, covered: result.covered } };
}

/** @deprecated Use resolveCheckoutFulfillmentFeeService */
export async function resolveCheckoutDeliveryFeeService(
  config: SupabaseConfig,
  raw: unknown,
) {
  return resolveCheckoutFulfillmentFeeService(config, {
    ...(typeof raw === "object" && raw !== null ? raw : {}),
    method: "delivery",
  });
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

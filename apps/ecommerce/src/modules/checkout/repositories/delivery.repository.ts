import "server-only";

import { createSupabaseServerClient } from "@de-tin-marin/db/server";
import type { SupabaseConfig } from "@de-tin-marin/db/config";
import type { Database } from "@de-tin-marin/types/database";
import { logServerError, logServerInfo } from "@/shared/errors/server-error";

type DeliveryZoneRow = Database["pricing"]["Tables"]["delivery_zones"]["Row"];
type DeliverySettingsRow =
  Database["pricing"]["Tables"]["delivery_settings"]["Row"];
type PickupPointRow = Database["pricing"]["Tables"]["pickup_points"]["Row"];
type CourierDepartmentRow =
  Database["pricing"]["Tables"]["courier_departments"]["Row"];

export async function listActiveDeliveryZonesRepo(
  config: SupabaseConfig,
): Promise<DeliveryZoneRow[]> {
  const scope = "listActiveDeliveryZonesRepo";
  logServerInfo(scope, "query.start", {
    schema: "pricing",
    table: "delivery_zones",
    filter: "is_active=true",
  });

  const supabase = await createSupabaseServerClient(config);
  const { data, error } = await supabase
    .schema("pricing")
    .from("delivery_zones")
    .select("id, district, fee, is_active, sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("district", { ascending: true });

  if (error) {
    logServerError(scope, {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    throw new Error(
      error.message ||
        `delivery_zones select failed (${error.code ?? "unknown"})`,
    );
  }

  const rows = (data ?? []) as DeliveryZoneRow[];
  logServerInfo(scope, "query.ok", {
    rowCount: rows.length,
    districts: rows.map((row) => row.district).slice(0, 30),
  });
  return rows;
}

export async function getDeliverySettingsRepo(
  config: SupabaseConfig,
): Promise<DeliverySettingsRow | null> {
  const scope = "getDeliverySettingsRepo";
  const supabase = await createSupabaseServerClient(config);
  const result = await supabase
    .schema("pricing")
    .from("delivery_settings")
    .select("*")
    .eq("singleton_key", "default")
    .maybeSingle();

  if (result.error) {
    logServerError(scope, {
      message: result.error.message,
      code: result.error.code,
      details: result.error.details,
      hint: result.error.hint,
    });
    throw new Error(result.error.message);
  }

  logServerInfo(scope, "query.ok", {
    found: Boolean(result.data),
    deliveryEnabled:
      (result.data as DeliverySettingsRow | null)?.delivery_enabled ?? null,
    pickupEnabled:
      (result.data as DeliverySettingsRow | null)?.pickup_enabled ?? null,
    pickupPointsEnabled:
      (result.data as DeliverySettingsRow | null)?.pickup_points_enabled ??
      null,
  });
  return result.data as DeliverySettingsRow | null;
}

export async function listActivePickupPointsRepo(
  config: SupabaseConfig,
): Promise<PickupPointRow[]> {
  const scope = "listActivePickupPointsRepo";
  logServerInfo(scope, "query.start", {
    schema: "pricing",
    table: "pickup_points",
    filter: "is_active=true",
  });

  const supabase = await createSupabaseServerClient(config);
  const { data, error } = await supabase
    .schema("pricing")
    .from("pickup_points")
    .select("id, name, lat, lng, fee, is_active, sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    logServerError(scope, {
      message: error.message,
      code: error.code,
    });
    throw new Error(error.message);
  }

  const rows = (data ?? []) as PickupPointRow[];
  logServerInfo(scope, "query.ok", { rowCount: rows.length });
  return rows;
}

export async function getPickupPointByIdRepo(
  config: SupabaseConfig,
  id: string,
): Promise<PickupPointRow | null> {
  const scope = "getPickupPointByIdRepo";
  const supabase = await createSupabaseServerClient(config);
  const { data, error } = await supabase
    .schema("pricing")
    .from("pickup_points")
    .select("id, name, lat, lng, fee, is_active, sort_order")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    logServerError(scope, {
      message: error.message,
      code: error.code,
      pickupPointId: id,
    });
    throw new Error(error.message);
  }

  return data as PickupPointRow | null;
}

export async function listActiveCourierDepartmentsRepo(
  config: SupabaseConfig,
): Promise<CourierDepartmentRow[]> {
  const scope = "listActiveCourierDepartmentsRepo";
  const supabase = await createSupabaseServerClient(config);
  const { data, error } = await supabase
    .schema("pricing")
    .from("courier_departments")
    .select("id, name, provinces, is_active, sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    logServerError(scope, {
      message: error.message,
      code: error.code,
    });
    throw new Error(error.message);
  }

  const rows = (data ?? []) as CourierDepartmentRow[];
  logServerInfo(scope, "query.ok", { rowCount: rows.length });
  return rows;
}

export async function getCourierDepartmentByIdRepo(
  config: SupabaseConfig,
  id: string,
): Promise<CourierDepartmentRow | null> {
  const scope = "getCourierDepartmentByIdRepo";
  const supabase = await createSupabaseServerClient(config);
  const { data, error } = await supabase
    .schema("pricing")
    .from("courier_departments")
    .select("id, name, provinces, is_active, sort_order")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    logServerError(scope, {
      message: error.message,
      code: error.code,
      departmentId: id,
    });
    throw new Error(error.message);
  }

  return data as CourierDepartmentRow | null;
}

import "server-only";

import { createSupabaseServerClient } from "@de-tin-marin/db/server";
import type { SupabaseConfig } from "@de-tin-marin/db/config";
import type { Database } from "@de-tin-marin/types/database";
import { logServerError, logServerInfo } from "@/shared/errors/server-error";

type DeliveryZoneRow = Database["pricing"]["Tables"]["delivery_zones"]["Row"];
type DeliverySettingsRow =
  Database["pricing"]["Tables"]["delivery_settings"]["Row"];

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
  });
  return result.data as DeliverySettingsRow | null;
}

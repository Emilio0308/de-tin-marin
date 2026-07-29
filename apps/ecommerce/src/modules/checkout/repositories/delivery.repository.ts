import "server-only";

import { createSupabaseServerClient } from "@de-tin-marin/db/server";
import type { SupabaseConfig } from "@de-tin-marin/db/config";
import type { Database } from "@de-tin-marin/types/database";

type DeliveryZoneRow = Database["pricing"]["Tables"]["delivery_zones"]["Row"];
type DeliverySettingsRow =
  Database["pricing"]["Tables"]["delivery_settings"]["Row"];

export async function listActiveDeliveryZonesRepo(
  config: SupabaseConfig,
): Promise<DeliveryZoneRow[]> {
  const supabase = await createSupabaseServerClient(config);
  const { data, error } = await supabase
    .schema("pricing")
    .from("delivery_zones")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("district", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as DeliveryZoneRow[];
}

export async function getDeliverySettingsRepo(
  config: SupabaseConfig,
): Promise<DeliverySettingsRow | null> {
  const supabase = await createSupabaseServerClient(config);
  const result = await supabase
    .schema("pricing")
    .from("delivery_settings")
    .select("*")
    .eq("singleton_key", "default")
    .maybeSingle();

  if (result.error) throw new Error(result.error.message);
  return result.data as DeliverySettingsRow | null;
}

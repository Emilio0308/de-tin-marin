import "server-only";

import { createSupabaseServerClient } from "@de-tin-marin/db/server";
import type { SupabaseConfig } from "@de-tin-marin/db/config";
import type { Database } from "@de-tin-marin/types/database";

type DeliveryZoneRow = Database["pricing"]["Tables"]["delivery_zones"]["Row"];
type DeliveryZoneInsert =
  Database["pricing"]["Tables"]["delivery_zones"]["Insert"];
type DeliveryZoneUpdate =
  Database["pricing"]["Tables"]["delivery_zones"]["Update"];
type DeliverySettingsRow =
  Database["pricing"]["Tables"]["delivery_settings"]["Row"];
type DeliverySettingsUpdate =
  Database["pricing"]["Tables"]["delivery_settings"]["Update"];

export async function listDeliveryZonesRepo(
  config: SupabaseConfig,
): Promise<DeliveryZoneRow[]> {
  const supabase = await createSupabaseServerClient(config);
  const { data, error } = await supabase
    .schema("pricing")
    .from("delivery_zones")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("district", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as DeliveryZoneRow[];
}

export async function upsertDeliveryZoneRepo(
  config: SupabaseConfig,
  row: DeliveryZoneInsert & { id?: string },
): Promise<DeliveryZoneRow> {
  const supabase = await createSupabaseServerClient(config);

  if (row.id) {
    const updateRow: DeliveryZoneUpdate = {
      district: row.district,
      fee: row.fee,
      is_active: row.is_active,
      sort_order: row.sort_order,
    };
    const result = await supabase
      .schema("pricing")
      .from("delivery_zones")
      .update(updateRow)
      .eq("id", row.id)
      .select("*")
      .single();

    if (result.error) throw new Error(result.error.message);
    return result.data as DeliveryZoneRow;
  }

  const result = await supabase
    .schema("pricing")
    .from("delivery_zones")
    .insert(row)
    .select("*")
    .single();

  if (result.error) throw new Error(result.error.message);
  return result.data as DeliveryZoneRow;
}

export async function deleteDeliveryZoneRepo(
  config: SupabaseConfig,
  id: string,
): Promise<void> {
  const supabase = await createSupabaseServerClient(config);
  const { error } = await supabase
    .schema("pricing")
    .from("delivery_zones")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
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

export async function updateDeliverySettingsRepo(
  config: SupabaseConfig,
  row: DeliverySettingsUpdate,
): Promise<DeliverySettingsRow> {
  const supabase = await createSupabaseServerClient(config);
  const result = await supabase
    .schema("pricing")
    .from("delivery_settings")
    .update(row)
    .eq("singleton_key", "default")
    .select("*")
    .single();

  if (result.error) throw new Error(result.error.message);
  return result.data as DeliverySettingsRow;
}

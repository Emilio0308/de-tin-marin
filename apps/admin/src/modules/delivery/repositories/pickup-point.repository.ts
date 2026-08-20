import "server-only";

import { createSupabaseServerClient } from "@de-tin-marin/db/server";
import type { SupabaseConfig } from "@de-tin-marin/db/config";
import type { Database } from "@de-tin-marin/types/database";

type PickupPointRow = Database["pricing"]["Tables"]["pickup_points"]["Row"];
type PickupPointInsert =
  Database["pricing"]["Tables"]["pickup_points"]["Insert"];
type PickupPointUpdate =
  Database["pricing"]["Tables"]["pickup_points"]["Update"];

export async function listPickupPointsRepo(
  config: SupabaseConfig,
): Promise<PickupPointRow[]> {
  const supabase = await createSupabaseServerClient(config);
  const { data, error } = await supabase
    .schema("pricing")
    .from("pickup_points")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as PickupPointRow[];
}

export async function listActivePickupPointsRepo(
  config: SupabaseConfig,
): Promise<PickupPointRow[]> {
  const supabase = await createSupabaseServerClient(config);
  const { data, error } = await supabase
    .schema("pricing")
    .from("pickup_points")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as PickupPointRow[];
}

export async function getPickupPointByIdRepo(
  config: SupabaseConfig,
  id: string,
): Promise<PickupPointRow | null> {
  const supabase = await createSupabaseServerClient(config);
  const result = await supabase
    .schema("pricing")
    .from("pickup_points")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (result.error) throw new Error(result.error.message);
  return (result.data ?? null) as PickupPointRow | null;
}

export async function upsertPickupPointRepo(
  config: SupabaseConfig,
  row: PickupPointInsert & { id?: string },
): Promise<PickupPointRow> {
  const supabase = await createSupabaseServerClient(config);

  if (row.id) {
    const updateRow: PickupPointUpdate = {
      name: row.name,
      lat: row.lat,
      lng: row.lng,
      fee: row.fee,
      is_active: row.is_active,
      sort_order: row.sort_order,
    };
    const result = await supabase
      .schema("pricing")
      .from("pickup_points")
      .update(updateRow)
      .eq("id", row.id)
      .select("*")
      .single();

    if (result.error) throw new Error(result.error.message);
    return result.data as PickupPointRow;
  }

  const result = await supabase
    .schema("pricing")
    .from("pickup_points")
    .insert(row)
    .select("*")
    .single();

  if (result.error) throw new Error(result.error.message);
  return result.data as PickupPointRow;
}

export async function deletePickupPointRepo(
  config: SupabaseConfig,
  id: string,
): Promise<void> {
  const supabase = await createSupabaseServerClient(config);
  const { error } = await supabase
    .schema("pricing")
    .from("pickup_points")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
}

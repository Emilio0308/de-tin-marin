import "server-only";

import { createSupabaseServerClient } from "@de-tin-marin/db/server";
import type { SupabaseConfig } from "@de-tin-marin/db/config";
import type { Database, Json } from "@de-tin-marin/types/database";
import { parseContainerPricesJson as parseContainerPricesFromShared } from "@de-tin-marin/shared/prices";

type SurpriseContainerRow =
  Database["catalog"]["Tables"]["surprise_containers"]["Row"];
type SurpriseContainerInsert =
  Database["catalog"]["Tables"]["surprise_containers"]["Insert"];
type SurpriseContainerUpdate =
  Database["catalog"]["Tables"]["surprise_containers"]["Update"];

export type { SurpriseContainerRow };

export function parseContainerPricesJson(prices: Json | null | undefined): {
  netPrice: number;
} {
  return parseContainerPricesFromShared(prices);
}

export async function listSurpriseContainersRepo(
  config: SupabaseConfig,
): Promise<SurpriseContainerRow[]> {
  const supabase = await createSupabaseServerClient(config);
  const { data, error } = await supabase
    .schema("catalog")
    .from("surprise_containers")
    .select("*")
    .is("deleted_at", null)
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as SurpriseContainerRow[];
}

export async function getSurpriseContainerByIdRepo(
  config: SupabaseConfig,
  id: string,
): Promise<SurpriseContainerRow | null> {
  const supabase = await createSupabaseServerClient(config);
  const result = await supabase
    .schema("catalog")
    .from("surprise_containers")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (result.error) throw new Error(result.error.message);
  return result.data as SurpriseContainerRow | null;
}

export async function isContainerSkuTakenRepo(
  config: SupabaseConfig,
  sku: string,
  excludeId?: string,
): Promise<boolean> {
  const supabase = await createSupabaseServerClient(config);
  let query = supabase
    .schema("catalog")
    .from("surprise_containers")
    .select("id")
    .eq("sku", sku)
    .is("deleted_at", null);

  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  const { data, error } = await query.limit(1);
  if (error) throw new Error(error.message);
  return (data?.length ?? 0) > 0;
}

export async function countActiveBundlesByContainerIdRepo(
  config: SupabaseConfig,
  containerId: string,
): Promise<number> {
  const supabase = await createSupabaseServerClient(config);
  const { count, error } = await supabase
    .schema("catalog")
    .from("bundles")
    .select("id", { count: "exact", head: true })
    .eq("container_id", containerId)
    .is("deleted_at", null);

  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function insertSurpriseContainerRepo(
  config: SupabaseConfig,
  row: SurpriseContainerInsert,
): Promise<SurpriseContainerRow> {
  const supabase = await createSupabaseServerClient(config);
  const result = await supabase
    .schema("catalog")
    .from("surprise_containers")
    .insert(row)
    .select("*")
    .single();

  if (result.error) throw new Error(result.error.message);
  return result.data as SurpriseContainerRow;
}

export async function updateSurpriseContainerRepo(
  config: SupabaseConfig,
  id: string,
  row: SurpriseContainerUpdate,
): Promise<void> {
  const supabase = await createSupabaseServerClient(config);
  const { error } = await supabase
    .schema("catalog")
    .from("surprise_containers")
    .update(row)
    .eq("id", id);

  if (error) throw new Error(error.message);
}

export async function softDeleteSurpriseContainerRepo(
  config: SupabaseConfig,
  id: string,
): Promise<void> {
  const supabase = await createSupabaseServerClient(config);
  const { error } = await supabase
    .schema("catalog")
    .from("surprise_containers")
    .update({ deleted_at: new Date().toISOString(), is_active: false })
    .eq("id", id);

  if (error) throw new Error(error.message);
}

export async function getActiveContainersByIdsRepo(
  config: SupabaseConfig,
  ids: string[],
): Promise<SurpriseContainerRow[]> {
  if (ids.length === 0) return [];

  const supabase = await createSupabaseServerClient(config);
  const { data, error } = await supabase
    .schema("catalog")
    .from("surprise_containers")
    .select("*")
    .in("id", ids)
    .eq("is_active", true)
    .is("deleted_at", null);

  if (error) throw new Error(error.message);
  return (data ?? []) as SurpriseContainerRow[];
}

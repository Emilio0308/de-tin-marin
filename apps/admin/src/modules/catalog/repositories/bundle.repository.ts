import "server-only";

import { createSupabaseServerClient } from "@de-tin-marin/db/server";
import type { SupabaseConfig } from "@de-tin-marin/db/config";
import type { Database, Json } from "@de-tin-marin/types/database";

type BundleRow = Database["catalog"]["Tables"]["bundles"]["Row"];
export type { BundleRow };
type BundleInsert = Database["catalog"]["Tables"]["bundles"]["Insert"];
type BundleUpdate = Database["catalog"]["Tables"]["bundles"]["Update"];
type BundleItemRow = Database["catalog"]["Tables"]["bundle_items"]["Row"];
type BundleItemInsert = Database["catalog"]["Tables"]["bundle_items"]["Insert"];

export type BundleItemWithProduct = BundleItemRow & {
  products: {
    name: string;
    prices: Json;
    is_active: boolean;
    deleted_at: string | null;
  } | null;
};

export type BundleContainer = {
  id: string;
  sku: string;
  name: string;
  prices: Json;
};

export type BundleWithItems = BundleRow & {
  surprise_containers: BundleContainer | null;
  bundle_items: BundleItemWithProduct[];
};

export async function listBundlesRepo(
  config: SupabaseConfig,
): Promise<BundleRow[]> {
  const supabase = await createSupabaseServerClient(config);
  const { data, error } = await supabase
    .schema("catalog")
    .from("bundles")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as BundleRow[];
}

export async function getBundleByIdRepo(
  config: SupabaseConfig,
  id: string,
): Promise<BundleWithItems | null> {
  const supabase = await createSupabaseServerClient(config);
  const result = await supabase
    .schema("catalog")
    .from("bundles")
    .select(
      "*, surprise_containers(id, sku, name, prices), bundle_items(*, products(name, prices, is_active, deleted_at))",
    )
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (result.error) throw new Error(result.error.message);
  return result.data as BundleWithItems | null;
}

export async function listBundleItemsByBundleIdsRepo(
  config: SupabaseConfig,
  bundleIds: string[],
): Promise<BundleItemWithProduct[]> {
  if (bundleIds.length === 0) return [];

  const supabase = await createSupabaseServerClient(config);
  const { data, error } = await supabase
    .schema("catalog")
    .from("bundle_items")
    .select("*, products(name, prices, is_active, deleted_at)")
    .in("bundle_id", bundleIds);

  if (error) throw new Error(error.message);
  return (data ?? []) as BundleItemWithProduct[];
}

export async function insertBundleRepo(
  config: SupabaseConfig,
  row: BundleInsert,
): Promise<BundleRow> {
  const supabase = await createSupabaseServerClient(config);
  const result = await supabase
    .schema("catalog")
    .from("bundles")
    .insert(row)
    .select("*")
    .single();

  if (result.error) throw new Error(result.error.message);
  return result.data as BundleRow;
}

export async function updateBundleRepo(
  config: SupabaseConfig,
  id: string,
  row: BundleUpdate,
): Promise<void> {
  const supabase = await createSupabaseServerClient(config);
  const { error } = await supabase
    .schema("catalog")
    .from("bundles")
    .update(row)
    .eq("id", id);

  if (error) throw new Error(error.message);
}

export async function softDeleteBundleRepo(
  config: SupabaseConfig,
  id: string,
): Promise<void> {
  const supabase = await createSupabaseServerClient(config);
  const { error } = await supabase
    .schema("catalog")
    .from("bundles")
    .update({ deleted_at: new Date().toISOString(), is_active: false })
    .eq("id", id);

  if (error) throw new Error(error.message);
}

export async function hardDeleteBundleRepo(
  config: SupabaseConfig,
  id: string,
): Promise<void> {
  const supabase = await createSupabaseServerClient(config);
  const { error } = await supabase
    .schema("catalog")
    .from("bundles")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
}

export async function replaceBundleItemsRepo(
  config: SupabaseConfig,
  bundleId: string,
  items: Pick<BundleItemInsert, "product_id" | "units_per_person">[],
): Promise<void> {
  const supabase = await createSupabaseServerClient(config);

  const { error: deleteError } = await supabase
    .schema("catalog")
    .from("bundle_items")
    .delete()
    .eq("bundle_id", bundleId);

  if (deleteError) throw new Error(deleteError.message);

  if (items.length === 0) return;

  const rows: BundleItemInsert[] = items.map((item) => ({
    bundle_id: bundleId,
    product_id: item.product_id,
    units_per_person: item.units_per_person,
  }));

  const { error: insertError } = await supabase
    .schema("catalog")
    .from("bundle_items")
    .insert(rows);

  if (insertError) throw new Error(insertError.message);
}

export async function getActiveProductsByIdsRepo(
  config: SupabaseConfig,
  productIds: string[],
): Promise<{ id: string; name: string }[]> {
  if (productIds.length === 0) return [];

  const supabase = await createSupabaseServerClient(config);
  const { data, error } = await supabase
    .schema("catalog")
    .from("products")
    .select("id, name")
    .in("id", productIds)
    .eq("is_active", true)
    .is("deleted_at", null);

  if (error) throw new Error(error.message);
  return data ?? [];
}

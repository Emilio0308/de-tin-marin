import "server-only";

import { createSupabaseServerClient } from "@de-tin-marin/db/server";
import type { SupabaseConfig } from "@de-tin-marin/db/config";
import type { Database, Json } from "@de-tin-marin/types/database";

type PackRow = Database["catalog"]["Tables"]["packs"]["Row"];
export type { PackRow };
type PackInsert = Database["catalog"]["Tables"]["packs"]["Insert"];
type PackUpdate = Database["catalog"]["Tables"]["packs"]["Update"];
type PackItemRow = Database["catalog"]["Tables"]["pack_items"]["Row"];
type PackItemInsert = Database["catalog"]["Tables"]["pack_items"]["Insert"];

export type PackItemWithProduct = PackItemRow & {
  products: {
    name: string;
    prices: Json;
    is_active: boolean;
    deleted_at: string | null;
  } | null;
};

export type PackWithItems = PackRow & {
  pack_items: PackItemWithProduct[];
};

export async function listPacksRepo(
  config: SupabaseConfig,
): Promise<PackRow[]> {
  const supabase = await createSupabaseServerClient(config);
  const { data, error } = await supabase
    .schema("catalog")
    .from("packs")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as PackRow[];
}

export async function getPackByIdRepo(
  config: SupabaseConfig,
  id: string,
): Promise<PackWithItems | null> {
  const supabase = await createSupabaseServerClient(config);
  const result = await supabase
    .schema("catalog")
    .from("packs")
    .select("*, pack_items(*, products(name, prices, is_active, deleted_at))")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (result.error) throw new Error(result.error.message);
  return result.data as PackWithItems | null;
}

export async function listPackItemsByPackIdsRepo(
  config: SupabaseConfig,
  packIds: string[],
): Promise<PackItemWithProduct[]> {
  if (packIds.length === 0) return [];

  const supabase = await createSupabaseServerClient(config);
  const { data, error } = await supabase
    .schema("catalog")
    .from("pack_items")
    .select("*, products(name, prices, is_active, deleted_at)")
    .in("pack_id", packIds);

  if (error) throw new Error(error.message);
  return (data ?? []) as PackItemWithProduct[];
}

export async function insertPackRepo(
  config: SupabaseConfig,
  row: PackInsert,
): Promise<PackRow> {
  const supabase = await createSupabaseServerClient(config);
  const result = await supabase
    .schema("catalog")
    .from("packs")
    .insert(row)
    .select("*")
    .single();

  if (result.error) throw new Error(result.error.message);
  return result.data as PackRow;
}

export async function updatePackRepo(
  config: SupabaseConfig,
  id: string,
  row: PackUpdate,
): Promise<void> {
  const supabase = await createSupabaseServerClient(config);
  const { error } = await supabase
    .schema("catalog")
    .from("packs")
    .update(row)
    .eq("id", id);

  if (error) throw new Error(error.message);
}

export async function softDeletePackRepo(
  config: SupabaseConfig,
  id: string,
): Promise<void> {
  const supabase = await createSupabaseServerClient(config);
  const { error } = await supabase
    .schema("catalog")
    .from("packs")
    .update({ deleted_at: new Date().toISOString(), is_active: false })
    .eq("id", id);

  if (error) throw new Error(error.message);
}

export async function hardDeletePackRepo(
  config: SupabaseConfig,
  id: string,
): Promise<void> {
  const supabase = await createSupabaseServerClient(config);
  const { error } = await supabase
    .schema("catalog")
    .from("packs")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
}

export async function replacePackItemsRepo(
  config: SupabaseConfig,
  packId: string,
  items: Pick<PackItemInsert, "product_id" | "package_quantity">[],
): Promise<void> {
  const supabase = await createSupabaseServerClient(config);

  const { error: deleteError } = await supabase
    .schema("catalog")
    .from("pack_items")
    .delete()
    .eq("pack_id", packId);

  if (deleteError) throw new Error(deleteError.message);

  if (items.length === 0) return;

  const rows: PackItemInsert[] = items.map((item) => ({
    pack_id: packId,
    product_id: item.product_id,
    package_quantity: item.package_quantity,
  }));

  const { error: insertError } = await supabase
    .schema("catalog")
    .from("pack_items")
    .insert(rows);

  if (insertError) throw new Error(insertError.message);
}

export async function isPackSkuTakenRepo(
  config: SupabaseConfig,
  sku: string,
  excludeId?: string,
): Promise<boolean> {
  const supabase = await createSupabaseServerClient(config);
  let query = supabase
    .schema("catalog")
    .from("packs")
    .select("id")
    .eq("sku", sku)
    .is("deleted_at", null);

  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  const { data, error } = await query.maybeSingle();
  if (error) throw new Error(error.message);
  return data !== null;
}

export async function isPackSlugTakenRepo(
  config: SupabaseConfig,
  slug: string,
  excludeId?: string,
): Promise<boolean> {
  const supabase = await createSupabaseServerClient(config);
  let query = supabase
    .schema("catalog")
    .from("packs")
    .select("id")
    .eq("slug", slug)
    .is("deleted_at", null);

  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  const { data, error } = await query.maybeSingle();
  if (error) throw new Error(error.message);
  return data !== null;
}

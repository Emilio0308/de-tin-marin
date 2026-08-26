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
    sku: string;
    name: string;
    prices: Json;
    is_active: boolean;
    deleted_at: string | null;
    product_type: string;
    items_per_package: number;
    package_label: string | null;
    stock_sealed_packages: number;
    stock_loose_base_units: number;
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

export type PackListFilters = {
  search?: string;
  status?: "all" | "active" | "inactive";
};

export type PackListPagination = {
  page: number;
  pageSize: number;
};

function escapeIlike(term: string): string {
  return term.replace(/[%_\\]/g, "\\$&");
}

export async function listPacksPageRepo(
  config: SupabaseConfig,
  filters: PackListFilters,
  pagination: PackListPagination,
): Promise<{ rows: PackRow[]; total: number }> {
  const supabase = await createSupabaseServerClient(config);
  const { page, pageSize } = pagination;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .schema("catalog")
    .from("packs")
    .select("*", { count: "exact" })
    .is("deleted_at", null);

  if (filters.status === "active") {
    query = query.eq("is_active", true);
  } else if (filters.status === "inactive") {
    query = query.eq("is_active", false);
  }

  if (filters.search) {
    const term = `%${escapeIlike(filters.search)}%`;
    query = query.or(`name.ilike.${term},sku.ilike.${term}`);
  }

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(from, to);

  if (error) throw new Error(error.message);
  return { rows: (data ?? []) as PackRow[], total: count ?? 0 };
}

export async function getPackByIdRepo(
  config: SupabaseConfig,
  id: string,
): Promise<PackWithItems | null> {
  const supabase = await createSupabaseServerClient(config);
  const result = await supabase
    .schema("catalog")
    .from("packs")
    .select(
      "*, pack_items(*, products(sku, name, prices, is_active, deleted_at, product_type, items_per_package, package_label, stock_sealed_packages, stock_loose_base_units))",
    )
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
    .select(
      "*, products(sku, name, prices, is_active, deleted_at, product_type, items_per_package, package_label, stock_sealed_packages, stock_loose_base_units)",
    )
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
  items: Pick<
    PackItemInsert,
    "product_id" | "package_quantity" | "unit_quantity"
  >[],
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
    unit_quantity: item.unit_quantity ?? 0,
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

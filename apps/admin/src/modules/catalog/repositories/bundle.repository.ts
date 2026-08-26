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
    sku: string;
    name: string;
    prices: Json;
    image_url: string | null;
    is_active: boolean;
    deleted_at: string | null;
    product_type: string;
    items_per_package: number;
    package_label: string | null;
    stock_sealed_packages: number;
    stock_loose_base_units: number;
  } | null;
};

const BUNDLE_ITEM_PRODUCT_SELECT =
  "sku, name, prices, image_url, is_active, deleted_at, product_type, items_per_package, package_label, stock_sealed_packages, stock_loose_base_units";

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

export type BundleListFilters = {
  search?: string;
  status?: "all" | "active" | "inactive";
};

export type BundleListPagination = {
  page: number;
  pageSize: number;
};

function escapeIlike(term: string): string {
  return term.replace(/[%_\\]/g, "\\$&");
}

export async function listBundlesPageRepo(
  config: SupabaseConfig,
  filters: BundleListFilters,
  pagination: BundleListPagination,
): Promise<{ rows: BundleRow[]; total: number }> {
  const supabase = await createSupabaseServerClient(config);
  const { page, pageSize } = pagination;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .schema("catalog")
    .from("bundles")
    .select("*", { count: "exact" })
    .is("deleted_at", null);

  if (filters.status === "active") {
    query = query.eq("is_active", true);
  } else if (filters.status === "inactive") {
    query = query.eq("is_active", false);
  }

  if (filters.search) {
    const term = `%${escapeIlike(filters.search)}%`;
    query = query.ilike("name", term);
  }

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(from, to);

  if (error) throw new Error(error.message);
  return { rows: (data ?? []) as BundleRow[], total: count ?? 0 };
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
      `*, surprise_containers(id, sku, name, prices), bundle_items(*, products(${BUNDLE_ITEM_PRODUCT_SELECT}))`,
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
    .select(`*, products(${BUNDLE_ITEM_PRODUCT_SELECT})`)
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

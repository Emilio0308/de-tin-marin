import "server-only";

import { createSupabaseServerClient } from "@de-tin-marin/db/server";
import type { SupabaseConfig } from "@de-tin-marin/db/config";
import type { Database, Json } from "@de-tin-marin/types/database";
import { parseProductPricesJson } from "@de-tin-marin/shared/prices";

type ProductRow = Database["catalog"]["Tables"]["products"]["Row"];
type ProductInsert = Database["catalog"]["Tables"]["products"]["Insert"];
type ProductUpdate = Database["catalog"]["Tables"]["products"]["Update"];
type CampaignRow = Database["pricing"]["Tables"]["campaigns"]["Row"];

export type ProductWithCategory = ProductRow & {
  categories: { name: string } | null;
};

export type CampaignPricingRow = Pick<
  CampaignRow,
  "id" | "name" | "percentage" | "starts_at" | "ends_at" | "is_active"
>;

export type ListProductsStatus = "all" | "active" | "inactive";

export async function listProductsRepo(
  config: SupabaseConfig,
  filters?: { status?: ListProductsStatus },
): Promise<ProductWithCategory[]> {
  const supabase = await createSupabaseServerClient(config);
  let query = supabase
    .schema("catalog")
    .from("products")
    .select("*, categories(name)")
    .is("deleted_at", null);

  if (filters?.status === "active") {
    query = query.eq("is_active", true);
  } else if (filters?.status === "inactive") {
    query = query.eq("is_active", false);
  }

  const { data, error } = await query.order("name", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as ProductWithCategory[];
}

export type ProductListFilters = {
  search?: string;
  categoryId?: string;
  status?: "all" | "active" | "inactive";
};

export type ProductListPagination = {
  page: number;
  pageSize: number;
};

function escapeIlike(term: string): string {
  return term.replace(/[%_\\]/g, "\\$&");
}

export function isPostgrestRangeNotSatisfiableError(message: string): boolean {
  return message.toLowerCase().includes("range not satisfiable");
}

const PRODUCT_LIST_SELECT =
  "id, sku, name, slug, brand, category_id, product_type, items_per_package, package_label, prices, cost_net_price, campaign_id, stock_sealed_packages, stock_loose_base_units, purchase_min_quantity, purchase_max_quantity, is_active, image_url, categories(name)";

export async function listProductsPageRepo(
  config: SupabaseConfig,
  filters: ProductListFilters,
  pagination: ProductListPagination,
): Promise<{ rows: ProductWithCategory[]; total: number; page: number }> {
  const supabase = await createSupabaseServerClient(config);
  const { pageSize } = pagination;
  let { page } = pagination;

  async function runQuery(requestedPage: number) {
    const from = (requestedPage - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .schema("catalog")
      .from("products")
      .select(PRODUCT_LIST_SELECT, { count: "exact" })
      .is("deleted_at", null);

    if (filters.categoryId) {
      query = query.eq("category_id", filters.categoryId);
    }

    if (filters.status === "active") {
      query = query.eq("is_active", true);
    } else if (filters.status === "inactive") {
      query = query.eq("is_active", false);
    }

    if (filters.search) {
      const term = `%${escapeIlike(filters.search)}%`;
      query = query.or(`name.ilike.${term},sku.ilike.${term}`);
    }

    return query
      .order("name", { ascending: true })
      .order("id", { ascending: true })
      .range(from, to);
  }

  let { data, error, count } = await runQuery(page);

  if (error && isPostgrestRangeNotSatisfiableError(error.message) && page > 1) {
    page = 1;
    ({ data, error, count } = await runQuery(page));
  }

  if (error) throw new Error(error.message);
  return {
    rows: (data ?? []) as unknown as ProductWithCategory[],
    total: count ?? 0,
    page,
  };
}

export async function listCampaignsByIdsRepo(
  config: SupabaseConfig,
  ids: string[],
): Promise<CampaignPricingRow[]> {
  if (ids.length === 0) return [];

  const supabase = await createSupabaseServerClient(config);
  const { data, error } = await supabase
    .schema("pricing")
    .from("campaigns")
    .select("id, name, percentage, starts_at, ends_at, is_active")
    .in("id", ids);

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function listActiveCampaignsRepo(
  config: SupabaseConfig,
): Promise<CampaignPricingRow[]> {
  const supabase = await createSupabaseServerClient(config);
  const { data, error } = await supabase
    .schema("pricing")
    .from("campaigns")
    .select("id, name, percentage, starts_at, ends_at, is_active")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getProductByIdRepo(
  config: SupabaseConfig,
  id: string,
): Promise<ProductRow | null> {
  const supabase = await createSupabaseServerClient(config);
  const result = await supabase
    .schema("catalog")
    .from("products")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (result.error) throw new Error(result.error.message);
  return result.data as ProductRow | null;
}

export async function insertProductRepo(
  config: SupabaseConfig,
  row: ProductInsert,
): Promise<ProductRow> {
  const supabase = await createSupabaseServerClient(config);
  const result = await supabase
    .schema("catalog")
    .from("products")
    .insert(row)
    .select("*")
    .single();

  if (result.error) throw new Error(result.error.message);
  return result.data as ProductRow;
}

export async function updateProductRepo(
  config: SupabaseConfig,
  id: string,
  row: ProductUpdate,
): Promise<void> {
  const supabase = await createSupabaseServerClient(config);
  const { error } = await supabase
    .schema("catalog")
    .from("products")
    .update(row)
    .eq("id", id);

  if (error) throw new Error(error.message);
}

export async function softDeleteProductRepo(
  config: SupabaseConfig,
  id: string,
): Promise<void> {
  const supabase = await createSupabaseServerClient(config);
  const { error } = await supabase
    .schema("catalog")
    .from("products")
    .update({ deleted_at: new Date().toISOString(), is_active: false })
    .eq("id", id);

  if (error) throw new Error(error.message);
}

export async function isSkuTakenRepo(
  config: SupabaseConfig,
  sku: string,
  excludeId?: string,
): Promise<boolean> {
  const supabase = await createSupabaseServerClient(config);
  let query = supabase
    .schema("catalog")
    .from("products")
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

export async function isProductSlugTakenRepo(
  config: SupabaseConfig,
  slug: string,
  excludeId?: string,
): Promise<boolean> {
  const supabase = await createSupabaseServerClient(config);
  let query = supabase
    .schema("catalog")
    .from("products")
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

export function parsePricesJson(prices: Json): {
  packageNetPrice: number;
  unitNetPrice: number;
} {
  return parseProductPricesJson(prices);
}

export type ProductPricesRow = {
  id: string;
  prices: Json;
};

export async function getProductsByIdsRepo(
  config: SupabaseConfig,
  productIds: string[],
): Promise<ProductPricesRow[]> {
  if (productIds.length === 0) return [];

  const supabase = await createSupabaseServerClient(config);
  const { data, error } = await supabase
    .schema("catalog")
    .from("products")
    .select("id, prices")
    .in("id", productIds)
    .is("deleted_at", null);

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function countProductsRepo(
  config: SupabaseConfig,
): Promise<number> {
  const supabase = await createSupabaseServerClient(config);
  const { count, error } = await supabase
    .schema("catalog")
    .from("products")
    .select("id", { count: "exact", head: true })
    .is("deleted_at", null);

  if (error) throw new Error(error.message);
  return count ?? 0;
}

export type LowStockProductCandidate = {
  id: string;
  name: string;
  items_per_package: number;
  stock_sealed_packages: number;
  stock_loose_base_units: number;
};

/** Candidates ordered by sealed then loose; caller filters computed total. */
export async function listLowStockProductCandidatesRepo(
  config: SupabaseConfig,
  limit = 50,
): Promise<LowStockProductCandidate[]> {
  const supabase = await createSupabaseServerClient(config);
  const { data, error } = await supabase
    .schema("catalog")
    .from("products")
    .select(
      "id, name, items_per_package, stock_sealed_packages, stock_loose_base_units",
    )
    .is("deleted_at", null)
    .eq("is_active", true)
    .order("stock_sealed_packages", { ascending: true })
    .order("stock_loose_base_units", { ascending: true })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data ?? [];
}

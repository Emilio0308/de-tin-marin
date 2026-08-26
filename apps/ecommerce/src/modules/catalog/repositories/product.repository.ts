import "server-only";

import { createSupabaseServerClient } from "@de-tin-marin/db/server";
import type { SupabaseConfig } from "@de-tin-marin/db/config";
import type { Json } from "@de-tin-marin/types/database";
import type { PublicCatalogSort } from "@de-tin-marin/validations/public-catalog";
import { productListRange } from "../helpers/catalog-list-pagination.helpers";

export type PublicProductRow = {
  id: string;
  sku: string;
  slug: string;
  name: string;
  brand: string | null;
  description: string | null;
  category_id: string;
  image_url: string | null;
  prices: Json;
  items_per_package: number;
  stock_sealed_packages: number;
  stock_loose_base_units: number;
  package_label: string | null;
  product_type: string;
  purchase_min_quantity: number;
  purchase_max_quantity: number;
  categories: { name: string } | null;
};

export type PublicProductFilters = {
  categoryId?: string;
  search?: string;
};

export type PublicProductListPagination = {
  page: number;
  pageSize: number;
  sort: PublicCatalogSort;
};

export type PublicProductListResult = {
  rows: PublicProductRow[];
  total: number;
};

const PRODUCT_LIST_SELECT =
  "id, sku, slug, name, brand, description, category_id, image_url, prices, items_per_package, stock_sealed_packages, stock_loose_base_units, package_label, product_type, purchase_min_quantity, purchase_max_quantity, categories(name)";

function escapeIlike(term: string): string {
  return term.replace(/[%_\\]/g, "\\$&");
}

function applyProductSort<T extends { order: (...args: never[]) => T }>(
  query: T,
  sort: PublicCatalogSort,
): T {
  const priceColumn = "prices->normal->netPrice";

  switch (sort) {
    case "name_desc":
      return query
        .order("name" as never, { ascending: false } as never)
        .order("id" as never, { ascending: true } as never);
    case "price_asc":
      return query
        .order(priceColumn as never, { ascending: true } as never)
        .order("id" as never, { ascending: true } as never);
    case "price_desc":
      return query
        .order(priceColumn as never, { ascending: false } as never)
        .order("id" as never, { ascending: true } as never);
    case "name_asc":
    default:
      return query
        .order("name" as never, { ascending: true } as never)
        .order("id" as never, { ascending: true } as never);
  }
}

export async function listPublicProductsRepo(
  config: SupabaseConfig,
  filters: PublicProductFilters,
  pagination: PublicProductListPagination,
): Promise<PublicProductListResult> {
  const supabase = await createSupabaseServerClient(config);
  const { page, pageSize, sort } = pagination;
  const { from, to } = productListRange(page, pageSize);

  let query = supabase
    .schema("catalog")
    .from("products")
    .select(PRODUCT_LIST_SELECT, { count: "exact" })
    .eq("is_active", true)
    .is("deleted_at", null);

  if (filters.categoryId) {
    query = query.eq("category_id", filters.categoryId);
  }

  if (filters.search) {
    const term = `%${escapeIlike(filters.search)}%`;
    query = query.or(`name.ilike.${term},sku.ilike.${term}`);
  }

  const ordered = applyProductSort(query, sort);
  const { data, error, count } = await ordered.range(from, to);
  if (error) throw new Error(error.message);

  return {
    rows: (data ?? []) as unknown as PublicProductRow[],
    total: count ?? 0,
  };
}

export async function getPublicProductBySlugRepo(
  config: SupabaseConfig,
  slug: string,
): Promise<PublicProductRow | null> {
  const supabase = await createSupabaseServerClient(config);
  const { data, error } = await supabase
    .schema("catalog")
    .from("products")
    .select(PRODUCT_LIST_SELECT)
    .eq("slug", slug)
    .eq("is_active", true)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as PublicProductRow | null;
}

export async function getPublicProductByIdRepo(
  config: SupabaseConfig,
  id: string,
): Promise<PublicProductRow | null> {
  const supabase = await createSupabaseServerClient(config);
  const { data, error } = await supabase
    .schema("catalog")
    .from("products")
    .select(PRODUCT_LIST_SELECT)
    .eq("id", id)
    .eq("is_active", true)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as PublicProductRow | null;
}

export async function getPublicProductsByIdsRepo(
  config: SupabaseConfig,
  productIds: string[],
): Promise<PublicProductRow[]> {
  if (productIds.length === 0) return [];

  const supabase = await createSupabaseServerClient(config);
  const { data, error } = await supabase
    .schema("catalog")
    .from("products")
    .select(PRODUCT_LIST_SELECT)
    .in("id", productIds)
    .eq("is_active", true)
    .is("deleted_at", null);

  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as PublicProductRow[];
}

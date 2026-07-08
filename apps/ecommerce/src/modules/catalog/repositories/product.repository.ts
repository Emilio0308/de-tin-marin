import "server-only";

import { createSupabaseServerClient } from "@de-tin-marin/db/server";
import type { SupabaseConfig } from "@de-tin-marin/db/config";
import type { Json } from "@de-tin-marin/types/database";

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

function escapeIlike(term: string): string {
  return term.replace(/[%_\\]/g, "\\$&");
}

export async function listPublicProductsRepo(
  config: SupabaseConfig,
  filters: PublicProductFilters,
): Promise<PublicProductRow[]> {
  const supabase = await createSupabaseServerClient(config);
  let query = supabase
    .schema("catalog")
    .from("products")
    .select(
      "id, sku, slug, name, brand, description, category_id, image_url, prices, items_per_package, stock_sealed_packages, stock_loose_base_units, package_label, product_type, purchase_min_quantity, purchase_max_quantity, categories(name)",
    )
    .eq("is_active", true)
    .is("deleted_at", null);

  if (filters.categoryId) {
    query = query.eq("category_id", filters.categoryId);
  }

  if (filters.search) {
    const term = `%${escapeIlike(filters.search)}%`;
    query = query.or(`name.ilike.${term},sku.ilike.${term}`);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as PublicProductRow[];
}

export async function getPublicProductBySlugRepo(
  config: SupabaseConfig,
  slug: string,
): Promise<PublicProductRow | null> {
  const supabase = await createSupabaseServerClient(config);
  const { data, error } = await supabase
    .schema("catalog")
    .from("products")
    .select(
      "id, sku, slug, name, brand, description, category_id, image_url, prices, items_per_package, stock_sealed_packages, stock_loose_base_units, package_label, product_type, purchase_min_quantity, purchase_max_quantity, categories(name)",
    )
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
    .select(
      "id, sku, slug, name, brand, description, category_id, image_url, prices, items_per_package, stock_sealed_packages, stock_loose_base_units, package_label, product_type, purchase_min_quantity, purchase_max_quantity, categories(name)",
    )
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
    .select(
      "id, sku, slug, name, brand, description, category_id, image_url, prices, items_per_package, stock_sealed_packages, stock_loose_base_units, package_label, product_type, purchase_min_quantity, purchase_max_quantity, categories(name)",
    )
    .in("id", productIds)
    .eq("is_active", true)
    .is("deleted_at", null);

  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as PublicProductRow[];
}

import "server-only";

import { createSupabaseServerClient } from "@de-tin-marin/db/server";
import type { SupabaseConfig } from "@de-tin-marin/db/config";
import type { Database, Json } from "@de-tin-marin/types/database";

type PackRow = Database["catalog"]["Tables"]["packs"]["Row"];

export type PublicPackItemRow = {
  pack_id: string;
  product_id: string;
  package_quantity: number;
  products: {
    name: string;
    description: string | null;
    image_url: string | null;
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

export type PublicPackRow = PackRow;

export type PublicPackFilters = {
  search?: string;
};

function escapeIlike(term: string): string {
  return term.replace(/[%_\\]/g, "\\$&");
}

export async function listPublicPacksRepo(
  config: SupabaseConfig,
  filters: PublicPackFilters,
): Promise<PublicPackRow[]> {
  const supabase = await createSupabaseServerClient(config);
  let query = supabase
    .schema("catalog")
    .from("packs")
    .select("*")
    .eq("is_active", true)
    .is("deleted_at", null);

  if (filters.search) {
    const term = `%${escapeIlike(filters.search)}%`;
    query = query.or(`name.ilike.${term},sku.ilike.${term}`);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as PublicPackRow[];
}

export async function getPublicPackBySlugRepo(
  config: SupabaseConfig,
  slug: string,
): Promise<PublicPackRow | null> {
  const supabase = await createSupabaseServerClient(config);
  const result = await supabase
    .schema("catalog")
    .from("packs")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .is("deleted_at", null)
    .maybeSingle();

  if (result.error) throw new Error(result.error.message);
  return result.data as PublicPackRow | null;
}

export async function getPublicPackByIdRepo(
  config: SupabaseConfig,
  id: string,
): Promise<PublicPackRow | null> {
  const supabase = await createSupabaseServerClient(config);
  const result = await supabase
    .schema("catalog")
    .from("packs")
    .select("*")
    .eq("id", id)
    .eq("is_active", true)
    .is("deleted_at", null)
    .maybeSingle();

  if (result.error) throw new Error(result.error.message);
  return result.data as PublicPackRow | null;
}

export async function listPublicPackItemsByPackIdsRepo(
  config: SupabaseConfig,
  packIds: string[],
): Promise<PublicPackItemRow[]> {
  if (packIds.length === 0) return [];

  const supabase = await createSupabaseServerClient(config);
  const { data, error } = await supabase
    .schema("catalog")
    .from("pack_items")
    .select(
      "pack_id, product_id, package_quantity, products(name, description, image_url, prices, is_active, deleted_at, product_type, items_per_package, package_label, stock_sealed_packages, stock_loose_base_units)",
    )
    .in("pack_id", packIds);

  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as PublicPackItemRow[];
}

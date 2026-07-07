import "server-only";

import { createSupabaseServerClient } from "@de-tin-marin/db/server";
import type { SupabaseConfig } from "@de-tin-marin/db/config";
import type { Database, Json } from "@de-tin-marin/types/database";

type BundleRow = Database["catalog"]["Tables"]["bundles"]["Row"];

export type PublicBundleItemRow = {
  bundle_id: string;
  product_id: string;
  units_per_person: number;
  products: {
    name: string;
    prices: Json;
    is_active: boolean;
    deleted_at: string | null;
  } | null;
};

export type PublicBundleRow = BundleRow;

export type PublicBundleFilters = {
  search?: string;
};

function escapeIlike(term: string): string {
  return term.replace(/[%_\\]/g, "\\$&");
}

export async function listPublicBundlesRepo(
  config: SupabaseConfig,
  filters: PublicBundleFilters,
): Promise<PublicBundleRow[]> {
  const supabase = await createSupabaseServerClient(config);
  let query = supabase
    .schema("catalog")
    .from("bundles")
    .select("*")
    .eq("is_active", true)
    .is("deleted_at", null);

  if (filters.search) {
    const term = `%${escapeIlike(filters.search)}%`;
    query = query.ilike("name", term);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as PublicBundleRow[];
}

export async function getPublicBundleByIdRepo(
  config: SupabaseConfig,
  id: string,
): Promise<PublicBundleRow | null> {
  const supabase = await createSupabaseServerClient(config);
  const result = await supabase
    .schema("catalog")
    .from("bundles")
    .select("*")
    .eq("id", id)
    .eq("is_active", true)
    .is("deleted_at", null)
    .maybeSingle();

  if (result.error) throw new Error(result.error.message);
  return result.data as PublicBundleRow | null;
}

export async function listPublicBundleItemsByBundleIdsRepo(
  config: SupabaseConfig,
  bundleIds: string[],
): Promise<PublicBundleItemRow[]> {
  if (bundleIds.length === 0) return [];

  const supabase = await createSupabaseServerClient(config);
  const { data, error } = await supabase
    .schema("catalog")
    .from("bundle_items")
    .select(
      "bundle_id, product_id, units_per_person, products(name, prices, is_active, deleted_at)",
    )
    .in("bundle_id", bundleIds);

  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as PublicBundleItemRow[];
}

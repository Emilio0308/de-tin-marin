import "server-only";

import { createSupabaseServerClient } from "@de-tin-marin/db/server";
import type { SupabaseConfig } from "@de-tin-marin/db/config";
import type { Database, Json } from "@de-tin-marin/types/database";
import type { PublicCatalogSort } from "@de-tin-marin/validations/public-catalog";
import {
  orderRowsByIds,
  parseCatalogListRpcPayload,
} from "../helpers/catalog-list-pagination.helpers";

type BundleRow = Database["catalog"]["Tables"]["bundles"]["Row"];

export type PublicBundleItemRow = {
  bundle_id: string;
  product_id: string;
  units_per_person: number;
  products: {
    name: string;
    image_url: string | null;
    prices: Json;
    is_active: boolean;
    deleted_at: string | null;
  } | null;
};

export type PublicBundleRow = BundleRow;

export type PublicBundleListPagination = {
  page: number;
  pageSize: number;
  sort: PublicCatalogSort;
  search?: string;
};

export type PublicBundleListResult = {
  rows: PublicBundleRow[];
  total: number;
};

export async function listPublicBundlesRepo(
  config: SupabaseConfig,
  pagination: PublicBundleListPagination,
): Promise<PublicBundleListResult> {
  const supabase = await createSupabaseServerClient(config);
  const { page, pageSize, sort, search } = pagination;

  const rpcResult = await supabase
    .schema("catalog")
    .rpc("list_public_bundles", {
      p_page: page,
      p_page_size: pageSize,
      p_search: search ?? null,
      p_sort: sort,
    });

  if (rpcResult.error) throw new Error(rpcResult.error.message);

  const { ids, total } = parseCatalogListRpcPayload(rpcResult.data);
  if (ids.length === 0) {
    return { rows: [], total };
  }

  const { data, error } = await supabase
    .schema("catalog")
    .from("bundles")
    .select("*")
    .in("id", ids)
    .eq("is_active", true)
    .is("deleted_at", null);

  if (error) throw new Error(error.message);

  return {
    rows: orderRowsByIds((data ?? []) as PublicBundleRow[], ids),
    total,
  };
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
      "bundle_id, product_id, units_per_person, products(name, image_url, prices, is_active, deleted_at)",
    )
    .in("bundle_id", bundleIds);

  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as PublicBundleItemRow[];
}

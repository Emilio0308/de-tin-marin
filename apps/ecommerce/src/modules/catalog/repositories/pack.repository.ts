import "server-only";

import { createSupabaseServerClient } from "@de-tin-marin/db/server";
import type { SupabaseConfig } from "@de-tin-marin/db/config";
import type { Database, Json } from "@de-tin-marin/types/database";
import type { PublicCatalogSort } from "@de-tin-marin/validations/public-catalog";
import {
  orderRowsByIds,
  parseCatalogListRpcPayload,
} from "../helpers/catalog-list-pagination.helpers";

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

export type PublicPackListPagination = {
  page: number;
  pageSize: number;
  sort: PublicCatalogSort;
  search?: string;
};

export type PublicPackListResult = {
  rows: PublicPackRow[];
  total: number;
};

export async function listPublicPacksRepo(
  config: SupabaseConfig,
  pagination: PublicPackListPagination,
): Promise<PublicPackListResult> {
  const supabase = await createSupabaseServerClient(config);
  const { page, pageSize, sort, search } = pagination;

  const rpcResult = await supabase.schema("catalog").rpc("list_public_packs", {
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
    .from("packs")
    .select("*")
    .in("id", ids)
    .eq("is_active", true)
    .is("deleted_at", null);

  if (error) throw new Error(error.message);

  return {
    rows: orderRowsByIds((data ?? []) as PublicPackRow[], ids),
    total,
  };
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

export async function getPublicPacksByIdsRepo(
  config: SupabaseConfig,
  packIds: string[],
): Promise<PublicPackRow[]> {
  if (packIds.length === 0) return [];

  const supabase = await createSupabaseServerClient(config);
  const { data, error } = await supabase
    .schema("catalog")
    .from("packs")
    .select("*")
    .in("id", packIds)
    .eq("is_active", true)
    .is("deleted_at", null);

  if (error) throw new Error(error.message);
  return (data ?? []) as PublicPackRow[];
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

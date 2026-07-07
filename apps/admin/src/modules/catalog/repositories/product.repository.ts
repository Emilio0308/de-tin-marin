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

export async function listProductsRepo(
  config: SupabaseConfig,
): Promise<ProductWithCategory[]> {
  const supabase = await createSupabaseServerClient(config);
  const { data, error } = await supabase
    .schema("catalog")
    .from("products")
    .select("*, categories(name)")
    .is("deleted_at", null)
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as ProductWithCategory[];
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

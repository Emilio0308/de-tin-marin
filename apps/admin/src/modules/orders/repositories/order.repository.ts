import "server-only";

import { createSupabaseServerClient } from "@de-tin-marin/db/server";
import type { SupabaseConfig } from "@de-tin-marin/db/config";
import type { Database, Json } from "@de-tin-marin/types/database";

export type OrderRow = Database["commerce"]["Tables"]["orders"]["Row"];
export type OrderInsert = Database["commerce"]["Tables"]["orders"]["Insert"];

export async function listOrdersRepo(
  config: SupabaseConfig,
): Promise<OrderRow[]> {
  const supabase = await createSupabaseServerClient(config);
  const result = await supabase
    .schema("commerce")
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (result.error) throw new Error(result.error.message);
  return (result.data ?? []) as OrderRow[];
}

export async function getOrderByIdRepo(
  config: SupabaseConfig,
  id: string,
): Promise<OrderRow | null> {
  const supabase = await createSupabaseServerClient(config);
  const result = await supabase
    .schema("commerce")
    .from("orders")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (result.error) throw new Error(result.error.message);
  return result.data as OrderRow | null;
}

export async function countOrdersByDatePrefixRepo(
  config: SupabaseConfig,
  prefix: string,
): Promise<number> {
  const supabase = await createSupabaseServerClient(config);
  const result = await supabase
    .schema("commerce")
    .from("orders")
    .select("id", { count: "exact", head: true })
    .like("order_number", `${prefix}%`);

  if (result.error) throw new Error(result.error.message);
  return result.count ?? 0;
}

export async function insertOrderRepo(
  config: SupabaseConfig,
  row: OrderInsert,
): Promise<OrderRow> {
  const supabase = await createSupabaseServerClient(config);
  const result = await supabase
    .schema("commerce")
    .from("orders")
    .insert(row)
    .select("*")
    .single();

  if (result.error) throw new Error(result.error.message);
  return result.data as OrderRow;
}

export async function updateOrderStatusRepo(
  config: SupabaseConfig,
  id: string,
  status: string,
): Promise<OrderRow> {
  const supabase = await createSupabaseServerClient(config);
  const result = await supabase
    .schema("commerce")
    .from("orders")
    .update({ status })
    .eq("id", id)
    .select("*")
    .single();

  if (result.error) throw new Error(result.error.message);
  return result.data as OrderRow;
}

export function asJson(value: unknown): Json {
  return value as Json;
}

export type OrderProductRow = {
  id: string;
  sku: string;
  name: string;
  prices: Json;
  campaign_id: string | null;
};

export async function getOrderProductsByIdsRepo(
  config: SupabaseConfig,
  productIds: string[],
): Promise<OrderProductRow[]> {
  if (productIds.length === 0) return [];

  const supabase = await createSupabaseServerClient(config);
  const result = await supabase
    .schema("catalog")
    .from("products")
    .select("id, sku, name, prices, campaign_id")
    .in("id", productIds)
    .eq("is_active", true)
    .is("deleted_at", null);

  if (result.error) throw new Error(result.error.message);
  return result.data ?? [];
}

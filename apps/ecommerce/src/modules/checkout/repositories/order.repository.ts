import "server-only";

import { createSupabaseServerClient } from "@de-tin-marin/db/server";
import type { SupabaseConfig } from "@de-tin-marin/db/config";
import type { Database, Json } from "@de-tin-marin/types/database";

export type GuestOrderRow = Database["commerce"]["Tables"]["orders"]["Row"];
export type GuestOrderInsert =
  Database["commerce"]["Tables"]["orders"]["Insert"];

export async function countGuestOrdersByDatePrefixRepo(
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

export async function insertGuestOrderRepo(
  config: SupabaseConfig,
  row: GuestOrderInsert,
): Promise<GuestOrderRow> {
  const supabase = await createSupabaseServerClient(config);
  const result = await supabase
    .schema("commerce")
    .from("orders")
    .insert(row)
    .select("*")
    .single();

  if (result.error) throw new Error(result.error.message);
  return result.data as GuestOrderRow;
}

export function asJson(value: unknown): Json {
  return value as Json;
}

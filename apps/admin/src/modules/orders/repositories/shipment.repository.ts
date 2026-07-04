import "server-only";

import { createSupabaseServerClient } from "@de-tin-marin/db/server";
import type { SupabaseConfig } from "@de-tin-marin/db/config";
import type { Database } from "@de-tin-marin/types/database";

export type ShipmentRow = Database["commerce"]["Tables"]["shipments"]["Row"];
export type ShipmentInsert =
  Database["commerce"]["Tables"]["shipments"]["Insert"];

export async function getShipmentByOrderIdRepo(
  config: SupabaseConfig,
  orderId: string,
): Promise<ShipmentRow | null> {
  const supabase = await createSupabaseServerClient(config);
  const result = await supabase
    .schema("commerce")
    .from("shipments")
    .select("*")
    .eq("order_id", orderId)
    .maybeSingle();

  if (result.error) throw new Error(result.error.message);
  return result.data as ShipmentRow | null;
}

export async function upsertShipmentRepo(
  config: SupabaseConfig,
  row: ShipmentInsert,
): Promise<ShipmentRow> {
  const supabase = await createSupabaseServerClient(config);
  const result = await supabase
    .schema("commerce")
    .from("shipments")
    .upsert(row, { onConflict: "order_id" })
    .select("*")
    .single();

  if (result.error) throw new Error(result.error.message);
  return result.data as ShipmentRow;
}

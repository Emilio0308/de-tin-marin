import "server-only";

import { createSupabaseServerClient } from "@de-tin-marin/db/server";
import type { SupabaseConfig } from "@de-tin-marin/db/config";

const PENDING_ORDER_STATUSES = [
  "pending_payment",
  "paid",
  "preparing",
  "ready",
] as const;

export async function countOrdersByStatusesRepo(
  config: SupabaseConfig,
  statuses: readonly string[] = PENDING_ORDER_STATUSES,
): Promise<number> {
  const supabase = await createSupabaseServerClient(config);
  const result = await supabase
    .schema("commerce")
    .from("orders")
    .select("id", { count: "exact", head: true })
    .in("status", [...statuses]);

  if (result.error) throw new Error(result.error.message);
  return result.count ?? 0;
}

import "server-only";

import { createSupabaseServerClient } from "@de-tin-marin/db/server";
import type { SupabaseConfig } from "@de-tin-marin/db/config";

export async function getGuestOrderRpcRepo(
  config: SupabaseConfig,
  orderNumber: string,
  email: string,
): Promise<unknown> {
  const supabase = await createSupabaseServerClient(config);
  const result = await supabase.schema("commerce").rpc("get_guest_order", {
    p_order_number: orderNumber,
    p_email: email,
  });

  if (result.error) throw new Error(result.error.message);
  return result.data;
}

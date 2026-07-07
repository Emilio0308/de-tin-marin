"use server";

import { supabaseConfig } from "@/config/env";
import { guardAction } from "@/shared/errors/server-error";
import { checkCartStockService } from "../services/guest-order.service";

export async function checkCartStockAction(raw: unknown) {
  return guardAction("checkCartStockAction", async () => {
    const result = await checkCartStockService(supabaseConfig, raw);
    if (!result.ok) return { ok: false as const, error: result.error };
    return { ok: true as const, data: result.data };
  });
}

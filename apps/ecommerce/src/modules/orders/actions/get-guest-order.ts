"use server";

import { supabaseConfig } from "@/config/env";
import { guardAction } from "@/shared/errors/server-error";
import { getGuestOrderService } from "../services/guest-order-lookup.service";

export async function getGuestOrderAction(raw: unknown) {
  return guardAction("getGuestOrderAction", async () => {
    const result = await getGuestOrderService(supabaseConfig, raw);
    if (!result.ok) return { ok: false as const, error: result.error };
    return { ok: true as const, data: result.data };
  });
}

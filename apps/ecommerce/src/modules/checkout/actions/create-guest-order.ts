"use server";

import { supabaseConfig } from "@/config/env";
import { guardAction } from "@/shared/errors/server-error";
import { createGuestOrderService } from "../services/guest-order.service";

export async function createGuestOrderAction(raw: unknown) {
  return guardAction("createGuestOrderAction", async () => {
    const result = await createGuestOrderService(supabaseConfig, raw);
    if (!result.ok) return { ok: false as const, error: result.error };
    return { ok: true as const, data: result.data };
  });
}

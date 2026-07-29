"use server";

import { supabaseConfig } from "@/config/env";
import { guardAction } from "@/shared/errors/server-error";
import { resolveCheckoutDeliveryFeeService } from "../services/checkout-delivery.service";

export async function resolveCheckoutDeliveryFeeAction(raw: unknown) {
  return guardAction("resolveCheckoutDeliveryFeeAction", async () => {
    const result = await resolveCheckoutDeliveryFeeService(supabaseConfig, raw);
    if (!result.ok) return { ok: false as const, error: result.error };
    return { ok: true as const, data: result.data };
  });
}

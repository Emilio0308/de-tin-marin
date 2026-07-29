"use server";

import { supabaseConfig } from "@/config/env";
import { guardAction } from "@/shared/errors/server-error";
import { validateGuestCheckoutCartService } from "../services/guest-order.service";

export async function validateGuestCheckoutCartAction(raw: unknown) {
  return guardAction("validateGuestCheckoutCartAction", async () => {
    const result = await validateGuestCheckoutCartService(supabaseConfig, raw);
    if (!result.ok) return { ok: false as const, error: result.error };
    return { ok: true as const, data: result.data };
  });
}

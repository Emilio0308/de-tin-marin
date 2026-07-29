"use server";

import { supabaseConfig } from "@/config/env";
import { guardAction } from "@/shared/errors/server-error";
import { previewGuestOrderCartService } from "../services/guest-order.service";

export async function previewGuestOrderCartAction(raw: unknown) {
  return guardAction("previewGuestOrderCartAction", async () => {
    const result = await previewGuestOrderCartService(supabaseConfig, raw);
    if (!result.ok) return { ok: false as const, error: result.error };
    return { ok: true as const, data: result.data };
  });
}

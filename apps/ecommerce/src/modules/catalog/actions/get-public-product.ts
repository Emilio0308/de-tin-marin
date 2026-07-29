"use server";

import { supabaseConfig } from "@/config/env";
import { guardAction } from "@/shared/errors/server-error";
import { getPublicProductService } from "../services/public-catalog.service";

export async function getPublicProductAction(raw: unknown) {
  return guardAction("getPublicProductAction", async () => {
    const result = await getPublicProductService(supabaseConfig, raw);
    if (!result.ok) return { ok: false as const, error: result.error };
    return { ok: true as const, data: result.data };
  });
}

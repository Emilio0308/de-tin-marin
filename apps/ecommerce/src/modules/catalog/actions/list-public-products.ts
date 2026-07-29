"use server";

import { supabaseConfig } from "@/config/env";
import { guardAction } from "@/shared/errors/server-error";
import { listPublicProductsService } from "../services/public-catalog.service";

export async function listPublicProductsAction(raw: unknown) {
  return guardAction("listPublicProductsAction", async () => {
    const result = await listPublicProductsService(supabaseConfig, raw);
    if (!result.ok) return { ok: false as const, error: result.error };
    return { ok: true as const, data: result.data };
  });
}

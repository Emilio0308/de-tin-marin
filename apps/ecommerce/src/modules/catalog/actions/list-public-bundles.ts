"use server";

import { supabaseConfig } from "@/config/env";
import { guardAction } from "@/shared/errors/server-error";
import { listPublicBundlesService } from "../services/public-catalog.service";

export async function listPublicBundlesAction(raw: unknown) {
  return guardAction("listPublicBundlesAction", async () => {
    const result = await listPublicBundlesService(supabaseConfig, raw);
    if (!result.ok) return { ok: false as const, error: result.error };
    return { ok: true as const, data: result.data };
  });
}

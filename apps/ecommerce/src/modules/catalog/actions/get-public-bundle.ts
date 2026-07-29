"use server";

import { supabaseConfig } from "@/config/env";
import { guardAction } from "@/shared/errors/server-error";
import { getPublicBundleService } from "../services/public-catalog.service";

export async function getPublicBundleAction(raw: unknown) {
  return guardAction("getPublicBundleAction", async () => {
    const result = await getPublicBundleService(supabaseConfig, raw);
    if (!result.ok) return { ok: false as const, error: result.error };
    return { ok: true as const, data: result.data };
  });
}

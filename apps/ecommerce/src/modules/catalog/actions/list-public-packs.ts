"use server";

import { supabaseConfig } from "@/config/env";
import { guardAction } from "@/shared/errors/server-error";
import { listPublicPacksService } from "../services/public-catalog.service";

export async function listPublicPacksAction(raw: unknown) {
  return guardAction("listPublicPacksAction", async () => {
    const result = await listPublicPacksService(supabaseConfig, raw);
    if (!result.ok) return { ok: false as const, error: result.error };
    return { ok: true as const, data: result.data };
  });
}

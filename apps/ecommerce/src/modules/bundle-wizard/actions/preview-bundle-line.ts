"use server";

import { supabaseConfig } from "@/config/env";
import { guardAction } from "@/shared/errors/server-error";
import { previewBundleLineService } from "../services/bundle-wizard.service";

export async function previewBundleLineAction(raw: unknown) {
  return guardAction("previewBundleLineAction", async () => {
    const result = await previewBundleLineService(supabaseConfig, raw);
    if (!result.ok) return { ok: false as const, error: result.error };
    return { ok: true as const, data: result.data };
  });
}

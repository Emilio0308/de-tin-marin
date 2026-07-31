"use server";

import { supabaseConfig } from "@/config/env";
import { guardAction } from "@/shared/errors/server-error";
import { getPublicHeroConfigService } from "../services/public-hero.service";

export async function getPublicHeroConfigAction() {
  return guardAction("getPublicHeroConfigAction", async () => {
    const result = await getPublicHeroConfigService(supabaseConfig);
    if (!result.ok) return { ok: false as const, error: result.error };
    return { ok: true as const, data: result.data };
  });
}

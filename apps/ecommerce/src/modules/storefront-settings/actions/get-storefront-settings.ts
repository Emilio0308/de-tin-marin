"use server";

import { supabaseConfig } from "@/config/env";
import { guardAction } from "@/shared/errors/server-error";
import { getStorefrontSettingsService } from "../services/storefront-settings.service";

export async function getStorefrontSettingsAction() {
  return guardAction("getStorefrontSettingsAction", async () => {
    const data = await getStorefrontSettingsService(supabaseConfig);
    return { ok: true as const, data };
  });
}

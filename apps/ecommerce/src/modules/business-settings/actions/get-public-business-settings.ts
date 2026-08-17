"use server";

import { supabaseConfig } from "@/config/env";
import { guardAction } from "@/shared/errors/server-error";
import { getPublicBusinessSettingsService } from "../services/public-business-settings.service";

export async function getPublicBusinessSettingsAction() {
  return guardAction(
    "getPublicBusinessSettingsAction",
    async () => {
      const result = await getPublicBusinessSettingsService(supabaseConfig);
      if (!result.ok) return { ok: false as const, error: result.error };
      return { ok: true as const, data: result.data };
    },
    { operation: "getPublicBusinessSettingsAction" },
  );
}

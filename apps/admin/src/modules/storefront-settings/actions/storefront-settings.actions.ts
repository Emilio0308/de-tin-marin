"use server";

import { supabaseConfig } from "@/config/env";
import { requireStaff } from "@/shared/auth/require-staff";
import {
  guardAction,
  summarizeActionInput,
} from "@/shared/errors/server-error";
import {
  getStorefrontSettingsService,
  updateStorefrontSettingsService,
} from "@/modules/storefront-settings/services/storefront-settings.service";

export async function getStorefrontSettingsAction() {
  return guardAction("getStorefrontSettingsAction", async () => {
    const auth = await requireStaff(supabaseConfig);
    if (!auth.ok) return { ok: false as const, error: auth.error };
    const data = await getStorefrontSettingsService(supabaseConfig);
    return { ok: true as const, data };
  });
}

export async function updateStorefrontSettingsAction(raw: unknown) {
  return guardAction(
    "updateStorefrontSettingsAction",
    async () => {
      const auth = await requireStaff(supabaseConfig);
      if (!auth.ok) return { ok: false as const, error: auth.error };
      return updateStorefrontSettingsService(supabaseConfig, raw);
    },
    summarizeActionInput(raw),
  );
}

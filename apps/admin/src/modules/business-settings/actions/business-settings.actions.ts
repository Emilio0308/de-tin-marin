"use server";

import { supabaseConfig } from "@/config/env";
import { requireStaff } from "@/shared/auth/require-staff";
import { guardAction } from "@/shared/errors/server-error";
import {
  getBusinessSettingsService,
  updateBusinessSettingsService,
} from "@/modules/business-settings/services/business-settings.service";

export async function getBusinessSettingsAction() {
  return guardAction("getBusinessSettingsAction", async () => {
    const auth = await requireStaff(supabaseConfig);
    if (!auth.ok) return { ok: false as const, error: auth.error };
    const data = await getBusinessSettingsService(supabaseConfig);
    return { ok: true as const, data };
  });
}

export async function updateBusinessSettingsAction(raw: unknown) {
  return guardAction("updateBusinessSettingsAction", async () => {
    const auth = await requireStaff(supabaseConfig);
    if (!auth.ok) return { ok: false as const, error: auth.error };
    return updateBusinessSettingsService(supabaseConfig, raw);
  });
}

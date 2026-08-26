"use server";

import { supabaseConfig } from "@/config/env";
import { requireStaff } from "@/shared/auth/require-staff";
import { guardAction } from "@/shared/errors/server-error";
import {
  getAboutPageSettingsService,
  updateAboutPageSettingsService,
} from "@/modules/web-customization/services/about-page.service";

export async function getAboutPageSettingsAction() {
  return guardAction("getAboutPageSettingsAction", async () => {
    const auth = await requireStaff(supabaseConfig);
    if (!auth.ok) return { ok: false as const, error: auth.error };
    const data = await getAboutPageSettingsService(supabaseConfig);
    return { ok: true as const, data };
  });
}

export async function updateAboutPageSettingsAction(raw: unknown) {
  return guardAction("updateAboutPageSettingsAction", async () => {
    const auth = await requireStaff(supabaseConfig);
    if (!auth.ok) return { ok: false as const, error: auth.error };
    return updateAboutPageSettingsService(supabaseConfig, raw);
  });
}

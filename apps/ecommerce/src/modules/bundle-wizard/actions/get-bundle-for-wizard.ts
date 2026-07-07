"use server";

import { supabaseConfig } from "@/config/env";
import { guardAction } from "@/shared/errors/server-error";
import { getBundleForWizardService } from "../services/bundle-wizard.service";

export async function getBundleForWizardAction(raw: unknown) {
  return guardAction("getBundleForWizardAction", async () => {
    const result = await getBundleForWizardService(supabaseConfig, raw);
    if (!result.ok) return { ok: false as const, error: result.error };
    return { ok: true as const, data: result.data };
  });
}

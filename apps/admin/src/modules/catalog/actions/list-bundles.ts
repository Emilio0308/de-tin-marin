"use server";

import { supabaseConfig } from "@/config/env";
import { requireStaff } from "@/shared/auth/require-staff";
import { guardAction } from "@/shared/errors/server-error";
import { listBundlesService } from "@/modules/catalog/services/bundle.service";

export async function listBundlesAction() {
  return guardAction("listBundlesAction", async () => {
    const auth = await requireStaff(supabaseConfig);
    if (!auth.ok) return { ok: false as const, error: auth.error };

    const data = await listBundlesService(supabaseConfig);
    return { ok: true as const, data };
  });
}

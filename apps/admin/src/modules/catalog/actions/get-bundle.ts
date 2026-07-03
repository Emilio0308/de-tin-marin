"use server";

import { supabaseConfig } from "@/config/env";
import { requireStaff } from "@/shared/auth/require-staff";
import { guardAction } from "@/shared/errors/server-error";
import { getBundleService } from "@/modules/catalog/services/bundle.service";

export async function getBundleAction(id: string) {
  return guardAction("getBundleAction", async () => {
    const auth = await requireStaff(supabaseConfig);
    if (!auth.ok) return { ok: false as const, error: auth.error };

    const data = await getBundleService(supabaseConfig, id);
    if (!data) return { ok: false as const, error: "NOT_FOUND" as const };
    return { ok: true as const, data };
  });
}

"use server";

import { supabaseConfig } from "@/config/env";
import { requireStaff } from "@/shared/auth/require-staff";
import { guardAction } from "@/shared/errors/server-error";
import { listPacksService } from "@/modules/catalog/services/pack.service";

export async function listPacksAction() {
  return guardAction("listPacksAction", async () => {
    const auth = await requireStaff(supabaseConfig);
    if (!auth.ok) return { ok: false as const, error: auth.error };

    const data = await listPacksService(supabaseConfig);
    return { ok: true as const, data };
  });
}

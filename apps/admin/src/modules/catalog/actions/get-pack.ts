"use server";

import { supabaseConfig } from "@/config/env";
import { requireStaff } from "@/shared/auth/require-staff";
import { guardAction } from "@/shared/errors/server-error";
import { getPackService } from "@/modules/catalog/services/pack.service";

export async function getPackAction(id: string) {
  return guardAction("getPackAction", async () => {
    const auth = await requireStaff(supabaseConfig);
    if (!auth.ok) return { ok: false as const, error: auth.error };

    const data = await getPackService(supabaseConfig, id);
    if (!data) return { ok: false as const, error: "NOT_FOUND" as const };
    return { ok: true as const, data };
  });
}

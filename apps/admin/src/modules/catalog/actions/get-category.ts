"use server";

import { supabaseConfig } from "@/config/env";
import { requireStaff } from "@/shared/auth/require-staff";
import { guardAction } from "@/shared/errors/server-error";
import { getCategoryService } from "@/modules/catalog/services/category.service";

export async function getCategoryAction(id: string) {
  return guardAction("getCategoryAction", async () => {
    const auth = await requireStaff(supabaseConfig);
    if (!auth.ok) return { ok: false as const, error: auth.error };

    const data = await getCategoryService(supabaseConfig, id);
    if (!data) return { ok: false as const, error: "NOT_FOUND" as const };
    return { ok: true as const, data };
  });
}

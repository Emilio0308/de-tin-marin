"use server";

import { supabaseConfig } from "@/config/env";
import { requireStaff } from "@/shared/auth/require-staff";
import { guardAction } from "@/shared/errors/server-error";
import { getSurpriseContainerService } from "@/modules/catalog/services/surprise-container.service";

export async function getSurpriseContainerAction(id: string) {
  return guardAction("getSurpriseContainerAction", async () => {
    const auth = await requireStaff(supabaseConfig);
    if (!auth.ok) return { ok: false as const, error: auth.error };

    const data = await getSurpriseContainerService(supabaseConfig, id);
    if (!data) return { ok: false as const, error: "NOT_FOUND" as const };
    return { ok: true as const, data };
  });
}

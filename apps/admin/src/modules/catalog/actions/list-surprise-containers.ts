"use server";

import { supabaseConfig } from "@/config/env";
import { requireStaff } from "@/shared/auth/require-staff";
import { guardAction } from "@/shared/errors/server-error";
import { listSurpriseContainersService } from "@/modules/catalog/services/surprise-container.service";

export async function listSurpriseContainersAction() {
  return guardAction("listSurpriseContainersAction", async () => {
    const auth = await requireStaff(supabaseConfig);
    if (!auth.ok) return { ok: false as const, error: auth.error };

    const data = await listSurpriseContainersService(supabaseConfig);
    return { ok: true as const, data };
  });
}

"use server";

import { revalidatePath } from "next/cache";
import { supabaseConfig } from "@/config/env";
import { requireStaff } from "@/shared/auth/require-staff";
import { guardAction } from "@/shared/errors/server-error";
import { updateSurpriseContainerService } from "@/modules/catalog/services/surprise-container.service";

export async function updateSurpriseContainerAction(raw: unknown) {
  return guardAction("updateSurpriseContainerAction", async () => {
    const auth = await requireStaff(supabaseConfig);
    if (!auth.ok) return { ok: false as const, error: auth.error };

    const result = await updateSurpriseContainerService(supabaseConfig, raw);
    if (result.ok) {
      revalidatePath("/containers");
    }
    return result;
  });
}

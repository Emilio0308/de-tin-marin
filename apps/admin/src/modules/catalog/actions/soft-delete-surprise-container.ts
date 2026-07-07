"use server";

import { revalidatePath } from "next/cache";
import { supabaseConfig } from "@/config/env";
import { requireStaff } from "@/shared/auth/require-staff";
import { guardAction } from "@/shared/errors/server-error";
import { softDeleteSurpriseContainerService } from "@/modules/catalog/services/surprise-container.service";

export async function softDeleteSurpriseContainerAction(id: string) {
  return guardAction("softDeleteSurpriseContainerAction", async () => {
    const auth = await requireStaff(supabaseConfig);
    if (!auth.ok) return { ok: false as const, error: auth.error };

    const result = await softDeleteSurpriseContainerService(supabaseConfig, id);
    if (result.ok) {
      revalidatePath("/containers");
    }
    return result;
  });
}

"use server";

import { revalidatePath } from "next/cache";
import { supabaseConfig } from "@/config/env";
import { requireStaff } from "@/shared/auth/require-staff";
import { guardAction } from "@/shared/errors/server-error";
import { updatePackService } from "@/modules/catalog/services/pack.service";

export async function updatePackAction(raw: unknown) {
  return guardAction("updatePackAction", async () => {
    const auth = await requireStaff(supabaseConfig);
    if (!auth.ok) return { ok: false as const, error: auth.error };

    const result = await updatePackService(supabaseConfig, raw);
    if (result.ok) {
      revalidatePath("/packs");
    }
    return result;
  });
}

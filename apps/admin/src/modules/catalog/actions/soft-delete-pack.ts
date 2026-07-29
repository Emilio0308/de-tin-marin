"use server";

import { revalidatePath } from "next/cache";
import { supabaseConfig } from "@/config/env";
import { requireStaff } from "@/shared/auth/require-staff";
import { guardAction } from "@/shared/errors/server-error";
import { softDeletePackService } from "@/modules/catalog/services/pack.service";

export async function softDeletePackAction(id: string) {
  return guardAction("softDeletePackAction", async () => {
    const auth = await requireStaff(supabaseConfig);
    if (!auth.ok) return { ok: false as const, error: auth.error };

    const result = await softDeletePackService(supabaseConfig, id);
    if (result.ok) {
      revalidatePath("/packs");
    }
    return result;
  });
}

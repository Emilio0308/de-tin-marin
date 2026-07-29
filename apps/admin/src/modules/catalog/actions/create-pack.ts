"use server";

import { revalidatePath } from "next/cache";
import { supabaseConfig } from "@/config/env";
import { requireStaff } from "@/shared/auth/require-staff";
import { guardAction } from "@/shared/errors/server-error";
import { createPackService } from "@/modules/catalog/services/pack.service";

export async function createPackAction(raw: unknown) {
  return guardAction("createPackAction", async () => {
    const auth = await requireStaff(supabaseConfig);
    if (!auth.ok) return { ok: false as const, error: auth.error };

    const result = await createPackService(supabaseConfig, raw);
    if (result.ok) {
      revalidatePath("/packs");
    }
    return result;
  });
}

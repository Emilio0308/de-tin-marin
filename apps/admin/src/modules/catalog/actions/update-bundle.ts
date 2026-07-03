"use server";

import { revalidatePath } from "next/cache";
import { supabaseConfig } from "@/config/env";
import { requireStaff } from "@/shared/auth/require-staff";
import { guardAction } from "@/shared/errors/server-error";
import { updateBundleService } from "@/modules/catalog/services/bundle.service";

export async function updateBundleAction(raw: unknown) {
  return guardAction("updateBundleAction", async () => {
    const auth = await requireStaff(supabaseConfig);
    if (!auth.ok) return { ok: false as const, error: auth.error };

    const result = await updateBundleService(supabaseConfig, raw);
    if (result.ok) {
      revalidatePath("/bundles");
    }
    return result;
  });
}

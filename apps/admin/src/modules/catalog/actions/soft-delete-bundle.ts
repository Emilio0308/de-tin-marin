"use server";

import { revalidatePath } from "next/cache";
import { supabaseConfig } from "@/config/env";
import { requireStaff } from "@/shared/auth/require-staff";
import { guardAction } from "@/shared/errors/server-error";
import { softDeleteBundleService } from "@/modules/catalog/services/bundle.service";

export async function softDeleteBundleAction(id: string) {
  return guardAction("softDeleteBundleAction", async () => {
    const auth = await requireStaff(supabaseConfig);
    if (!auth.ok) return { ok: false as const, error: auth.error };

    const result = await softDeleteBundleService(supabaseConfig, id);
    if (result.ok) {
      revalidatePath("/bundles");
    }
    return result;
  });
}

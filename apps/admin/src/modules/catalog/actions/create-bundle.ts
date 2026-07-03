"use server";

import { revalidatePath } from "next/cache";
import { supabaseConfig } from "@/config/env";
import { requireStaff } from "@/shared/auth/require-staff";
import { guardAction } from "@/shared/errors/server-error";
import { createBundleService } from "@/modules/catalog/services/bundle.service";

export async function createBundleAction(raw: unknown) {
  return guardAction("createBundleAction", async () => {
    const auth = await requireStaff(supabaseConfig);
    if (!auth.ok) return { ok: false as const, error: auth.error };

    const result = await createBundleService(supabaseConfig, raw);
    if (result.ok) {
      revalidatePath("/bundles");
    }
    return result;
  });
}

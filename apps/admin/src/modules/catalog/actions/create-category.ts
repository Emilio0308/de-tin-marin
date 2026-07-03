"use server";

import { revalidatePath } from "next/cache";
import { supabaseConfig } from "@/config/env";
import { requireStaff } from "@/shared/auth/require-staff";
import { guardAction } from "@/shared/errors/server-error";
import { createCategoryService } from "@/modules/catalog/services/category.service";

export async function createCategoryAction(raw: unknown) {
  return guardAction("createCategoryAction", async () => {
    const auth = await requireStaff(supabaseConfig);
    if (!auth.ok) return { ok: false as const, error: auth.error };

    const result = await createCategoryService(supabaseConfig, raw);
    if (result.ok) {
      revalidatePath("/categories");
    }
    return result;
  });
}

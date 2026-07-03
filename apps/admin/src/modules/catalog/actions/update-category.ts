"use server";

import { revalidatePath } from "next/cache";
import { supabaseConfig } from "@/config/env";
import { requireStaff } from "@/shared/auth/require-staff";
import { updateCategoryService } from "@/modules/catalog/services/category.service";

export async function updateCategoryAction(raw: unknown) {
  const auth = await requireStaff(supabaseConfig);
  if (!auth.ok) return { ok: false as const, error: auth.error };

  const result = await updateCategoryService(supabaseConfig, raw);
  if (result.ok) {
    revalidatePath("/categories");
  }
  return result;
}

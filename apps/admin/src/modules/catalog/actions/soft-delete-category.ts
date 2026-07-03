"use server";

import { revalidatePath } from "next/cache";
import { supabaseConfig } from "@/config/env";
import { requireStaff } from "@/shared/auth/require-staff";
import { softDeleteCategoryService } from "@/modules/catalog/services/category.service";

export async function softDeleteCategoryAction(id: string) {
  const auth = await requireStaff(supabaseConfig);
  if (!auth.ok) return { ok: false as const, error: auth.error };

  const result = await softDeleteCategoryService(supabaseConfig, id);
  revalidatePath("/categories");
  return result;
}

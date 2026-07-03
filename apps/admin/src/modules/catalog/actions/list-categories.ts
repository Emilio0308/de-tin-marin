"use server";

import { supabaseConfig } from "@/config/env";
import { requireStaff } from "@/shared/auth/require-staff";
import { listCategoriesService } from "@/modules/catalog/services/category.service";

export async function listCategoriesAction() {
  const auth = await requireStaff(supabaseConfig);
  if (!auth.ok) return { ok: false as const, error: auth.error };

  const data = await listCategoriesService(supabaseConfig);
  return { ok: true as const, data };
}

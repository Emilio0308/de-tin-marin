"use server";

import { supabaseConfig } from "@/config/env";
import { requireStaff } from "@/shared/auth/require-staff";
import { guardAction } from "@/shared/errors/server-error";
import {
  listCategoriesPageService,
  listCategoriesService,
} from "@/modules/catalog/services/category.service";

export async function listCategoriesAction() {
  return guardAction("listCategoriesAction", async () => {
    const auth = await requireStaff(supabaseConfig);
    if (!auth.ok) return { ok: false as const, error: auth.error };

    const data = await listCategoriesService(supabaseConfig);
    return { ok: true as const, data };
  });
}

export async function listCategoriesPageAction(raw: unknown) {
  return guardAction("listCategoriesPageAction", async () => {
    const auth = await requireStaff(supabaseConfig);
    if (!auth.ok) return { ok: false as const, error: auth.error };

    const result = await listCategoriesPageService(supabaseConfig, raw);
    if (!result.ok) return { ok: false as const, error: result.error };
    return { ok: true as const, data: result.data };
  });
}

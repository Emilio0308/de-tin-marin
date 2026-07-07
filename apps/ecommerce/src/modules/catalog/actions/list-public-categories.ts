"use server";

import { supabaseConfig } from "@/config/env";
import { guardAction } from "@/shared/errors/server-error";
import { listPublicCategoriesService } from "../services/public-catalog.service";

export async function listPublicCategoriesAction() {
  return guardAction("listPublicCategoriesAction", async () => {
    const result = await listPublicCategoriesService(supabaseConfig);
    return { ok: true as const, data: result.data };
  });
}

"use server";

import { supabaseConfig } from "@/config/env";
import { requireStaff } from "@/shared/auth/require-staff";
import { guardAction } from "@/shared/errors/server-error";
import { listProductsService } from "@/modules/catalog/services/product.service";

export async function listProductsAction() {
  return guardAction("listProductsAction", async () => {
    const auth = await requireStaff(supabaseConfig);
    if (!auth.ok) return { ok: false as const, error: auth.error };

    const data = await listProductsService(supabaseConfig);
    return { ok: true as const, data };
  });
}

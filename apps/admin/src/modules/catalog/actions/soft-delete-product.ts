"use server";

import { revalidatePath } from "next/cache";
import { supabaseConfig } from "@/config/env";
import { requireStaff } from "@/shared/auth/require-staff";
import { guardAction } from "@/shared/errors/server-error";
import { softDeleteProductService } from "@/modules/catalog/services/product.service";

export async function softDeleteProductAction(id: string) {
  return guardAction("softDeleteProductAction", async () => {
    const auth = await requireStaff(supabaseConfig);
    if (!auth.ok) return { ok: false as const, error: auth.error };

    const result = await softDeleteProductService(supabaseConfig, id);
    revalidatePath("/products");
    return result;
  });
}

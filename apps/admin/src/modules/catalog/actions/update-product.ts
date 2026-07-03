"use server";

import { revalidatePath } from "next/cache";
import { supabaseConfig } from "@/config/env";
import { requireStaff } from "@/shared/auth/require-staff";
import { updateProductService } from "@/modules/catalog/services/product.service";

export async function updateProductAction(raw: unknown) {
  const auth = await requireStaff(supabaseConfig);
  if (!auth.ok) return { ok: false as const, error: auth.error };

  const result = await updateProductService(supabaseConfig, raw);
  if (result.ok) {
    revalidatePath("/products");
  }
  return result;
}

"use server";

import { supabaseConfig } from "@/config/env";
import { requireStaff } from "@/shared/auth/require-staff";
import { listProductsService } from "@/modules/catalog/services/product.service";

export async function listProductsAction() {
  const auth = await requireStaff(supabaseConfig);
  if (!auth.ok) return { ok: false as const, error: auth.error };

  const data = await listProductsService(supabaseConfig);
  return { ok: true as const, data };
}

"use server";

import { supabaseConfig } from "@/config/env";
import { requireStaff } from "@/shared/auth/require-staff";
import { getProductService } from "@/modules/catalog/services/product.service";

export async function getProductAction(id: string) {
  const auth = await requireStaff(supabaseConfig);
  if (!auth.ok) return { ok: false as const, error: auth.error };

  const data = await getProductService(supabaseConfig, id);
  if (!data) return { ok: false as const, error: "NOT_FOUND" as const };
  return { ok: true as const, data };
}

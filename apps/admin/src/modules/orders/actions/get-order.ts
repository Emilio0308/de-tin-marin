"use server";

import { supabaseConfig } from "@/config/env";
import { requireStaff } from "@/shared/auth/require-staff";
import { guardAction } from "@/shared/errors/server-error";
import { getOrderService } from "@/modules/orders/services/order.service";

export async function getOrderAction(id: string) {
  return guardAction("getOrderAction", async () => {
    const auth = await requireStaff(supabaseConfig);
    if (!auth.ok) return { ok: false as const, error: auth.error };

    return getOrderService(supabaseConfig, id);
  });
}

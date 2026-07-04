"use server";

import { revalidatePath } from "next/cache";
import { supabaseConfig } from "@/config/env";
import { requireStaff } from "@/shared/auth/require-staff";
import { guardAction } from "@/shared/errors/server-error";
import { createOrderService } from "@/modules/orders/services/order.service";

export async function createOrderAction(raw: unknown) {
  return guardAction("createOrderAction", async () => {
    const auth = await requireStaff(supabaseConfig);
    if (!auth.ok) return { ok: false as const, error: auth.error };

    const result = await createOrderService(supabaseConfig, raw);
    if (result.ok) {
      revalidatePath("/orders");
    }
    return result;
  });
}

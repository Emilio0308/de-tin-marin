"use server";

import { revalidatePath } from "next/cache";
import { supabaseConfig } from "@/config/env";
import { requireStaff } from "@/shared/auth/require-staff";
import { guardAction } from "@/shared/errors/server-error";
import { cancelOrderService } from "@/modules/orders/services/order.service";

export async function cancelOrderAction(id: string) {
  return guardAction("cancelOrderAction", async () => {
    const auth = await requireStaff(supabaseConfig);
    if (!auth.ok) return { ok: false as const, error: auth.error };

    const result = await cancelOrderService(supabaseConfig, id);
    if (result.ok) {
      revalidatePath("/orders");
      revalidatePath(`/orders/${id}`);
    }
    return result;
  });
}

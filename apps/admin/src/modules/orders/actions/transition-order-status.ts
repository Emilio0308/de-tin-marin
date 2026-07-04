"use server";

import { revalidatePath } from "next/cache";
import { supabaseConfig } from "@/config/env";
import { requireStaff } from "@/shared/auth/require-staff";
import { guardAction } from "@/shared/errors/server-error";
import { transitionOrderStatusService } from "@/modules/orders/services/order.service";

export async function transitionOrderStatusAction(raw: unknown) {
  return guardAction("transitionOrderStatusAction", async () => {
    const auth = await requireStaff(supabaseConfig);
    if (!auth.ok) return { ok: false as const, error: auth.error };

    const result = await transitionOrderStatusService(supabaseConfig, raw);

    if (result.ok) {
      revalidatePath("/orders");
      revalidatePath(`/orders/${result.data.id}`);
    }

    return result;
  });
}

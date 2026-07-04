"use server";

import { revalidatePath } from "next/cache";
import { supabaseConfig } from "@/config/env";
import { requireStaff } from "@/shared/auth/require-staff";
import { guardAction } from "@/shared/errors/server-error";
import { confirmPaymentService } from "@/modules/orders/services/payment.service";

export async function confirmPaymentAction(raw: unknown) {
  return guardAction("confirmPaymentAction", async () => {
    const auth = await requireStaff(supabaseConfig);
    if (!auth.ok) return { ok: false as const, error: auth.error };

    const result = await confirmPaymentService(
      supabaseConfig,
      auth.staff.userId,
      raw,
    );

    if (result.ok) {
      revalidatePath("/orders");
      revalidatePath(`/orders/${result.data.orderId}`);
    }

    return result;
  });
}

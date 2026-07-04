"use server";

import { revalidatePath } from "next/cache";
import { supabaseConfig } from "@/config/env";
import { requireStaff } from "@/shared/auth/require-staff";
import { guardAction } from "@/shared/errors/server-error";
import { getPaymentByIdRepo } from "@/modules/orders/repositories/payment.repository";
import { refundPaymentService } from "@/modules/orders/services/payment.service";

export async function refundPaymentAction(raw: unknown) {
  return guardAction("refundPaymentAction", async () => {
    const auth = await requireStaff(supabaseConfig);
    if (!auth.ok) return { ok: false as const, error: auth.error };

    const result = await refundPaymentService(supabaseConfig, raw);

    if (result.ok) {
      const payment = await getPaymentByIdRepo(
        supabaseConfig,
        result.data.paymentId,
      );
      if (payment) {
        revalidatePath("/orders");
        revalidatePath(`/orders/${payment.order_id}`);
      }
    }

    return result;
  });
}

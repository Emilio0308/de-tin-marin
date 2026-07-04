"use server";

import { revalidatePath } from "next/cache";
import { supabaseConfig } from "@/config/env";
import { requireStaff } from "@/shared/auth/require-staff";
import { guardAction } from "@/shared/errors/server-error";
import { upsertShipmentService } from "@/modules/orders/services/shipment.service";

export async function upsertShipmentAction(raw: unknown) {
  return guardAction("upsertShipmentAction", async () => {
    const auth = await requireStaff(supabaseConfig);
    if (!auth.ok) return { ok: false as const, error: auth.error };

    const result = await upsertShipmentService(supabaseConfig, raw);

    if (result.ok) {
      revalidatePath("/orders");
      revalidatePath(`/orders/${result.data.orderId}`);
    }

    return result;
  });
}

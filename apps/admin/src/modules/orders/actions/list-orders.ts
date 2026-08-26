"use server";

import { supabaseConfig } from "@/config/env";
import { requireStaff } from "@/shared/auth/require-staff";
import { guardAction } from "@/shared/errors/server-error";
import {
  listOrdersPageService,
  listOrdersService,
} from "@/modules/orders/services/order.service";

export async function listOrdersAction() {
  return guardAction("listOrdersAction", async () => {
    const auth = await requireStaff(supabaseConfig);
    if (!auth.ok) return { ok: false as const, error: auth.error };

    return listOrdersService(supabaseConfig);
  });
}

export async function listOrdersPageAction(raw: unknown) {
  return guardAction("listOrdersPageAction", async () => {
    const auth = await requireStaff(supabaseConfig);
    if (!auth.ok) return { ok: false as const, error: auth.error };

    const result = await listOrdersPageService(supabaseConfig, raw);
    if (!result.ok) return { ok: false as const, error: result.error };
    return { ok: true as const, data: result.data };
  });
}

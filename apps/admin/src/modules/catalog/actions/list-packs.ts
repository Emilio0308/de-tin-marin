"use server";

import { supabaseConfig } from "@/config/env";
import { requireStaff } from "@/shared/auth/require-staff";
import { guardAction } from "@/shared/errors/server-error";
import {
  listPacksPageService,
  listPacksService,
} from "@/modules/catalog/services/pack.service";

export async function listPacksAction() {
  return guardAction("listPacksAction", async () => {
    const auth = await requireStaff(supabaseConfig);
    if (!auth.ok) return { ok: false as const, error: auth.error };

    const data = await listPacksService(supabaseConfig);
    return { ok: true as const, data };
  });
}

export async function listPacksPageAction(raw: unknown) {
  return guardAction("listPacksPageAction", async () => {
    const auth = await requireStaff(supabaseConfig);
    if (!auth.ok) return { ok: false as const, error: auth.error };

    const result = await listPacksPageService(supabaseConfig, raw);
    if (!result.ok) return { ok: false as const, error: result.error };
    return { ok: true as const, data: result.data };
  });
}

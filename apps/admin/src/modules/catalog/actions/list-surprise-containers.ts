"use server";

import { supabaseConfig } from "@/config/env";
import { requireStaff } from "@/shared/auth/require-staff";
import { guardAction } from "@/shared/errors/server-error";
import {
  listSurpriseContainersPageService,
  listSurpriseContainersService,
} from "@/modules/catalog/services/surprise-container.service";

export async function listSurpriseContainersAction() {
  return guardAction("listSurpriseContainersAction", async () => {
    const auth = await requireStaff(supabaseConfig);
    if (!auth.ok) return { ok: false as const, error: auth.error };

    const data = await listSurpriseContainersService(supabaseConfig);
    return { ok: true as const, data };
  });
}

export async function listSurpriseContainersPageAction(raw: unknown) {
  return guardAction("listSurpriseContainersPageAction", async () => {
    const auth = await requireStaff(supabaseConfig);
    if (!auth.ok) return { ok: false as const, error: auth.error };

    const result = await listSurpriseContainersPageService(supabaseConfig, raw);
    if (!result.ok) return { ok: false as const, error: result.error };
    return { ok: true as const, data: result.data };
  });
}

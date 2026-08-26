"use server";

import { supabaseConfig } from "@/config/env";
import { requireStaff } from "@/shared/auth/require-staff";
import { guardAction } from "@/shared/errors/server-error";
import {
  listBundlesPageService,
  listBundlesService,
} from "@/modules/catalog/services/bundle.service";

export async function listBundlesAction() {
  return guardAction("listBundlesAction", async () => {
    const auth = await requireStaff(supabaseConfig);
    if (!auth.ok) return { ok: false as const, error: auth.error };

    const data = await listBundlesService(supabaseConfig);
    return { ok: true as const, data };
  });
}

export async function listBundlesPageAction(raw: unknown) {
  return guardAction("listBundlesPageAction", async () => {
    const auth = await requireStaff(supabaseConfig);
    if (!auth.ok) return { ok: false as const, error: auth.error };

    const result = await listBundlesPageService(supabaseConfig, raw);
    if (!result.ok) return { ok: false as const, error: result.error };
    return { ok: true as const, data: result.data };
  });
}

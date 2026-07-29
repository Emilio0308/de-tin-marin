"use server";

import { supabaseConfig } from "@/config/env";
import { createCatalogImageUploadUrlService } from "@/modules/media/services/presign-catalog-image.service";
import { requireStaff } from "@/shared/auth/require-staff";
import { guardAction } from "@/shared/errors/server-error";

export async function createCatalogImageUploadUrlAction(raw: unknown) {
  return guardAction("createCatalogImageUploadUrlAction", async () => {
    const auth = await requireStaff(supabaseConfig);
    if (!auth.ok) return { ok: false as const, error: auth.error };

    return createCatalogImageUploadUrlService(raw);
  });
}

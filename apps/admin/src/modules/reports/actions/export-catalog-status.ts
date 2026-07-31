"use server";

import { supabaseConfig } from "@/config/env";
import { requireStaff } from "@/shared/auth/require-staff";
import { guardAction } from "@/shared/errors/server-error";
import { exportCatalogStatusInputSchema } from "@/modules/reports/schemas/export-catalog-status.schema";
import { exportCatalogStatusReportService } from "@/modules/reports/services/catalog-status-report.service";

export async function exportCatalogStatusAction(raw: unknown) {
  return guardAction("exportCatalogStatusAction", async () => {
    const auth = await requireStaff(supabaseConfig);
    if (!auth.ok) return { ok: false as const, error: auth.error };

    const parsed = exportCatalogStatusInputSchema.safeParse(raw);
    if (!parsed.success) {
      return { ok: false as const, error: "VALIDATION" as const };
    }

    const data = await exportCatalogStatusReportService(
      supabaseConfig,
      parsed.data.sections,
    );

    return { ok: true as const, data };
  });
}

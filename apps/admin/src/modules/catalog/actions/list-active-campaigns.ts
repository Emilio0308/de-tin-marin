"use server";

import { supabaseConfig } from "@/config/env";
import { requireStaff } from "@/shared/auth/require-staff";
import { guardAction } from "@/shared/errors/server-error";
import { listActiveCampaignsRepo } from "@/modules/catalog/repositories/product.repository";

export async function listActiveCampaignsAction() {
  return guardAction("listActiveCampaignsAction", async () => {
    const auth = await requireStaff(supabaseConfig);
    if (!auth.ok) return { ok: false as const, error: auth.error };

    const rows = await listActiveCampaignsRepo(supabaseConfig);
    const data = rows.map((row) => ({
      id: row.id,
      name: row.name,
      percentage: Number(row.percentage),
      startsAt: row.starts_at,
      endsAt: row.ends_at,
      isActive: row.is_active,
    }));

    return { ok: true as const, data };
  });
}

import "server-only";

import type { SupabaseConfig } from "@de-tin-marin/db/config";
import { getCatalogVersionAtRepo } from "../repositories/catalog-cache-meta.repository";

export async function getCatalogVersionService(
  config: SupabaseConfig,
): Promise<{ ok: true; data: { versionAt: string } }> {
  const versionAt = await getCatalogVersionAtRepo(config);
  return { ok: true, data: { versionAt } };
}

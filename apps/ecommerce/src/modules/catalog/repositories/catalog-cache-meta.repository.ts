import "server-only";

import { createSupabaseServerClient } from "@de-tin-marin/db/server";
import type { SupabaseConfig } from "@de-tin-marin/db/config";

function readVersionAt(value: unknown): string | null {
  if (typeof value !== "object" || value === null) return null;
  if (!("version_at" in value)) return null;
  const versionAt = Reflect.get(value, "version_at");
  return typeof versionAt === "string" && versionAt.length > 0
    ? versionAt
    : null;
}

export async function getCatalogVersionAtRepo(
  config: SupabaseConfig,
): Promise<string> {
  const supabase = await createSupabaseServerClient(config);
  const { data, error } = await supabase
    .schema("catalog")
    .from("catalog_cache_meta")
    .select("version_at")
    .eq("singleton_key", "default")
    .maybeSingle();

  if (error) throw new Error(error.message);

  return readVersionAt(data) ?? new Date(0).toISOString();
}

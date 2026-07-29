import "server-only";

import { createSupabaseServerClient } from "@de-tin-marin/db/server";
import type { SupabaseConfig } from "@de-tin-marin/db/config";

/**
 * Bumps ecommerce catalog cache version and broadcasts via Realtime
 * (`catalog.bump_catalog_version` → `realtime.send`). Never throws.
 */
export async function bumpCatalogVersionSafe(
  config: SupabaseConfig,
): Promise<void> {
  try {
    const supabase = await createSupabaseServerClient(config);
    const result = await supabase.schema("catalog").rpc("bump_catalog_version");
    if (result.error) {
      console.error("[bumpCatalogVersionSafe]", result.error.message);
      return;
    }
    if (process.env.NODE_ENV === "development") {
      const versionAt =
        typeof result.data === "string" ? result.data : String(result.data);
      console.info("[bumpCatalogVersionSafe] version_at=", versionAt);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[bumpCatalogVersionSafe]", message);
  }
}

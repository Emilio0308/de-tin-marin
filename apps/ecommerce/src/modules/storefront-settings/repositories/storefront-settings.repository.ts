import "server-only";

import { createSupabaseServerClient } from "@de-tin-marin/db/server";
import type { SupabaseConfig } from "@de-tin-marin/db/config";
import type { Database } from "@de-tin-marin/types/database";

type StorefrontSettingsRow =
  Database["core"]["Tables"]["storefront_settings"]["Row"];

export async function getStorefrontSettingsRepo(
  config: SupabaseConfig,
): Promise<StorefrontSettingsRow | null> {
  const supabase = await createSupabaseServerClient(config);
  const result = await supabase
    .schema("core")
    .from("storefront_settings")
    .select("*")
    .eq("singleton_key", "default")
    .maybeSingle();

  if (result.error) throw new Error(result.error.message);
  return result.data as StorefrontSettingsRow | null;
}

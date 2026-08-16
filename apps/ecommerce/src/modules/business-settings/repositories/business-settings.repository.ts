import "server-only";

import { createSupabaseServerClient } from "@de-tin-marin/db/server";
import type { SupabaseConfig } from "@de-tin-marin/db/config";
import type { Database } from "@de-tin-marin/types/database";

type BusinessSettingsRow =
  Database["core"]["Tables"]["public_business_settings"]["Row"];

export async function getPublicBusinessSettingsRepo(
  config: SupabaseConfig,
): Promise<BusinessSettingsRow | null> {
  const supabase = await createSupabaseServerClient(config);
  const result = await supabase
    .schema("core")
    .from("public_business_settings")
    .select("*")
    .eq("singleton_key", "default")
    .maybeSingle();

  if (result.error) throw new Error(result.error.message);
  return result.data as BusinessSettingsRow | null;
}

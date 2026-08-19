import "server-only";

import { createSupabaseServerClient } from "@de-tin-marin/db/server";
import type { SupabaseConfig } from "@de-tin-marin/db/config";

export async function getPublicAboutPageSettingsRepo(
  config: SupabaseConfig,
): Promise<{ image_url: string | null } | null> {
  const supabase = await createSupabaseServerClient(config);
  const result = await supabase
    .schema("core")
    .from("about_page_settings")
    .select("image_url")
    .eq("singleton_key", "default")
    .maybeSingle();

  if (result.error) throw new Error(result.error.message);
  return result.data;
}

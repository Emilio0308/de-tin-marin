import "server-only";

import { createSupabaseServerClient } from "@de-tin-marin/db/server";
import type { SupabaseConfig } from "@de-tin-marin/db/config";
import type { Database } from "@de-tin-marin/types/database";

type AboutPageSettingsRow =
  Database["core"]["Tables"]["about_page_settings"]["Row"];
type AboutPageSettingsUpdate =
  Database["core"]["Tables"]["about_page_settings"]["Update"];

export async function getAboutPageSettingsRepo(
  config: SupabaseConfig,
): Promise<AboutPageSettingsRow | null> {
  const supabase = await createSupabaseServerClient(config);
  const result = await supabase
    .schema("core")
    .from("about_page_settings")
    .select("*")
    .eq("singleton_key", "default")
    .maybeSingle();

  if (result.error) throw new Error(result.error.message);
  return result.data as AboutPageSettingsRow | null;
}

export async function updateAboutPageSettingsRepo(
  config: SupabaseConfig,
  row: AboutPageSettingsUpdate,
): Promise<AboutPageSettingsRow> {
  const supabase = await createSupabaseServerClient(config);
  const result = await supabase
    .schema("core")
    .from("about_page_settings")
    .update(row)
    .eq("singleton_key", "default")
    .select("*")
    .single();

  if (result.error) throw new Error(result.error.message);
  return result.data as AboutPageSettingsRow;
}

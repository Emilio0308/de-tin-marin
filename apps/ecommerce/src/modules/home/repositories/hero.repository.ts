import "server-only";

import { createSupabaseServerClient } from "@de-tin-marin/db/server";
import type { SupabaseConfig } from "@de-tin-marin/db/config";
import type { Database } from "@de-tin-marin/types/database";

type HeroSettingsRow = Database["core"]["Tables"]["hero_settings"]["Row"];
type HeroImageRow = Database["core"]["Tables"]["hero_images"]["Row"];

export async function getPublicHeroSettingsRepo(
  config: SupabaseConfig,
): Promise<HeroSettingsRow | null> {
  const supabase = await createSupabaseServerClient(config);
  const result = await supabase
    .schema("core")
    .from("hero_settings")
    .select("*")
    .eq("singleton_key", "default")
    .maybeSingle();

  if (result.error) throw new Error(result.error.message);
  return result.data as HeroSettingsRow | null;
}

export async function listPublicHeroImagesRepo(
  config: SupabaseConfig,
): Promise<HeroImageRow[]> {
  const supabase = await createSupabaseServerClient(config);
  const { data, error } = await supabase
    .schema("core")
    .from("hero_images")
    .select("*")
    .is("deleted_at", null)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as HeroImageRow[];
}

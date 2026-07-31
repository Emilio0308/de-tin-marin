import "server-only";

import { createSupabaseServerClient } from "@de-tin-marin/db/server";
import type { SupabaseConfig } from "@de-tin-marin/db/config";
import type { Database } from "@de-tin-marin/types/database";

type HeroSettingsRow = Database["core"]["Tables"]["hero_settings"]["Row"];
type HeroSettingsUpdate = Database["core"]["Tables"]["hero_settings"]["Update"];
type HeroImageRow = Database["core"]["Tables"]["hero_images"]["Row"];
type HeroImageInsert = Database["core"]["Tables"]["hero_images"]["Insert"];
type HeroImageUpdate = Database["core"]["Tables"]["hero_images"]["Update"];

export async function getHeroSettingsRepo(
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

export async function updateHeroSettingsRepo(
  config: SupabaseConfig,
  row: HeroSettingsUpdate,
): Promise<HeroSettingsRow> {
  const supabase = await createSupabaseServerClient(config);
  const result = await supabase
    .schema("core")
    .from("hero_settings")
    .update(row)
    .eq("singleton_key", "default")
    .select("*")
    .single();

  if (result.error) throw new Error(result.error.message);
  return result.data as HeroSettingsRow;
}

export async function listHeroImagesRepo(
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

export async function createHeroImageRepo(
  config: SupabaseConfig,
  row: HeroImageInsert,
): Promise<HeroImageRow> {
  const supabase = await createSupabaseServerClient(config);
  const result = await supabase
    .schema("core")
    .from("hero_images")
    .insert(row)
    .select("*")
    .single();

  if (result.error) throw new Error(result.error.message);
  return result.data as HeroImageRow;
}

export async function updateHeroImageRepo(
  config: SupabaseConfig,
  id: string,
  row: HeroImageUpdate,
): Promise<HeroImageRow> {
  const supabase = await createSupabaseServerClient(config);
  const result = await supabase
    .schema("core")
    .from("hero_images")
    .update(row)
    .eq("id", id)
    .is("deleted_at", null)
    .select("*")
    .single();

  if (result.error) throw new Error(result.error.message);
  return result.data as HeroImageRow;
}

export async function softDeleteHeroImageRepo(
  config: SupabaseConfig,
  id: string,
): Promise<void> {
  const supabase = await createSupabaseServerClient(config);
  const { error } = await supabase
    .schema("core")
    .from("hero_images")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .is("deleted_at", null);

  if (error) throw new Error(error.message);
}

export async function reorderHeroImagesRepo(
  config: SupabaseConfig,
  orderedIds: string[],
): Promise<void> {
  const supabase = await createSupabaseServerClient(config);

  for (let index = 0; index < orderedIds.length; index += 1) {
    const id = orderedIds[index];
    if (!id) continue;
    const { error } = await supabase
      .schema("core")
      .from("hero_images")
      .update({ sort_order: index })
      .eq("id", id)
      .is("deleted_at", null);

    if (error) throw new Error(error.message);
  }
}

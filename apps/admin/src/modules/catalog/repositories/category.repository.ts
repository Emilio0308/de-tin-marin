import "server-only";

import { createSupabaseServerClient } from "@de-tin-marin/db/server";
import type { SupabaseConfig } from "@de-tin-marin/db/config";
import type { Database } from "@de-tin-marin/types/database";

type CategoryRow = Database["catalog"]["Tables"]["categories"]["Row"];
type CategoryInsert = Database["catalog"]["Tables"]["categories"]["Insert"];
type CategoryUpdate = Database["catalog"]["Tables"]["categories"]["Update"];

export async function listCategoriesRepo(
  config: SupabaseConfig,
): Promise<CategoryRow[]> {
  const supabase = await createSupabaseServerClient(config);
  const { data, error } = await supabase
    .schema("catalog")
    .from("categories")
    .select("*")
    .is("deleted_at", null)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as CategoryRow[];
}

export async function getCategoryByIdRepo(
  config: SupabaseConfig,
  id: string,
): Promise<CategoryRow | null> {
  const supabase = await createSupabaseServerClient(config);
  const result = await supabase
    .schema("catalog")
    .from("categories")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (result.error) throw new Error(result.error.message);
  return result.data as CategoryRow | null;
}

export async function insertCategoryRepo(
  config: SupabaseConfig,
  row: CategoryInsert,
): Promise<CategoryRow> {
  const supabase = await createSupabaseServerClient(config);
  const result = await supabase
    .schema("catalog")
    .from("categories")
    .insert(row)
    .select("*")
    .single();

  if (result.error) throw new Error(result.error.message);
  return result.data as CategoryRow;
}

export async function updateCategoryRepo(
  config: SupabaseConfig,
  id: string,
  row: CategoryUpdate,
): Promise<void> {
  const supabase = await createSupabaseServerClient(config);
  const { error } = await supabase
    .schema("catalog")
    .from("categories")
    .update(row)
    .eq("id", id);

  if (error) throw new Error(error.message);
}

export async function softDeleteCategoryRepo(
  config: SupabaseConfig,
  id: string,
): Promise<void> {
  const supabase = await createSupabaseServerClient(config);
  const { error } = await supabase
    .schema("catalog")
    .from("categories")
    .update({ deleted_at: new Date().toISOString(), is_active: false })
    .eq("id", id);

  if (error) throw new Error(error.message);
}

export async function isCategorySlugTakenRepo(
  config: SupabaseConfig,
  slug: string,
  excludeId?: string,
): Promise<boolean> {
  const supabase = await createSupabaseServerClient(config);
  let query = supabase
    .schema("catalog")
    .from("categories")
    .select("id")
    .eq("slug", slug)
    .is("deleted_at", null);

  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  const { data, error } = await query.maybeSingle();
  if (error) throw new Error(error.message);
  return data !== null;
}

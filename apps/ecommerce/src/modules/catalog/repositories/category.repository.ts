import "server-only";

import { createSupabaseServerClient } from "@de-tin-marin/db/server";
import type { SupabaseConfig } from "@de-tin-marin/db/config";
import type { Database } from "@de-tin-marin/types/database";

type CategoryRow = Database["catalog"]["Tables"]["categories"]["Row"];

export type PublicCategoryRow = Pick<CategoryRow, "id" | "name">;

export async function listPublicCategoriesRepo(
  config: SupabaseConfig,
): Promise<PublicCategoryRow[]> {
  const supabase = await createSupabaseServerClient(config);
  const { data, error } = await supabase
    .schema("catalog")
    .from("categories")
    .select("id, name")
    .eq("is_active", true)
    .is("deleted_at", null)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

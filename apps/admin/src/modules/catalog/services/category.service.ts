import "server-only";

import {
  createCategoryInputSchema,
  updateCategoryInputSchema,
} from "@de-tin-marin/validations/category";
import type { SupabaseConfig } from "@de-tin-marin/db/config";
import {
  getCategoryByIdRepo,
  insertCategoryRepo,
  isCategorySlugTakenRepo,
  listCategoriesRepo,
  softDeleteCategoryRepo,
  updateCategoryRepo,
} from "../repositories/category.repository";
import type { CategoryFormDTO, CategoryListItem } from "../types/category.dto";

function toListItem(
  row: Awaited<ReturnType<typeof listCategoriesRepo>>[number],
): CategoryListItem {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    isActive: row.is_active,
    sortOrder: row.sort_order,
    description: row.description,
  };
}

function toFormDTO(
  row: NonNullable<Awaited<ReturnType<typeof getCategoryByIdRepo>>>,
): CategoryFormDTO {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    slug: row.slug,
    sortOrder: row.sort_order,
    isActive: row.is_active,
  };
}

export async function listCategoriesService(
  config: SupabaseConfig,
): Promise<CategoryListItem[]> {
  const rows = await listCategoriesRepo(config);
  return rows.map(toListItem);
}

export async function getCategoryService(
  config: SupabaseConfig,
  id: string,
): Promise<CategoryFormDTO | null> {
  const row = await getCategoryByIdRepo(config, id);
  return row ? toFormDTO(row) : null;
}

export async function createCategoryService(
  config: SupabaseConfig,
  raw: unknown,
) {
  const parsed = createCategoryInputSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: "VALIDATION",
      details: parsed.error.flatten(),
    };
  }

  const slugTaken = await isCategorySlugTakenRepo(config, parsed.data.slug);
  if (slugTaken) {
    return { ok: false as const, error: "SLUG_TAKEN" };
  }

  const row = await insertCategoryRepo(config, {
    name: parsed.data.name,
    description: parsed.data.description ?? null,
    slug: parsed.data.slug,
    sort_order: parsed.data.sortOrder,
    is_active: parsed.data.isActive,
  });

  return { ok: true as const, id: row.id };
}

export async function updateCategoryService(
  config: SupabaseConfig,
  raw: unknown,
) {
  const parsed = updateCategoryInputSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: "VALIDATION",
      details: parsed.error.flatten(),
    };
  }

  const { id, ...fields } = parsed.data;

  if (fields.slug) {
    const slugTaken = await isCategorySlugTakenRepo(config, fields.slug, id);
    if (slugTaken) {
      return { ok: false as const, error: "SLUG_TAKEN" };
    }
  }

  await updateCategoryRepo(config, id, {
    ...(fields.name !== undefined ? { name: fields.name } : {}),
    ...(fields.description !== undefined
      ? { description: fields.description ?? null }
      : {}),
    ...(fields.slug !== undefined ? { slug: fields.slug } : {}),
    ...(fields.sortOrder !== undefined ? { sort_order: fields.sortOrder } : {}),
    ...(fields.isActive !== undefined ? { is_active: fields.isActive } : {}),
  });

  return { ok: true as const };
}

export async function softDeleteCategoryService(
  config: SupabaseConfig,
  id: string,
) {
  await softDeleteCategoryRepo(config, id);
  return { ok: true as const };
}

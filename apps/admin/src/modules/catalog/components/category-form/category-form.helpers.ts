import { slugify } from "@de-tin-marin/shared/slugify";
import type { CategoryFormDTO } from "@/modules/catalog/types/category.dto";
import type { CategoryFormValues } from "./category-form.types";

export const CATEGORY_NAME_MAX = 200;
export const CATEGORY_DESCRIPTION_MAX = 2000;

export function buildDefaultCategoryValues(): CategoryFormValues {
  return {
    name: "",
    description: "",
    slug: "",
    sortOrder: 0,
    isActive: true,
  };
}

export function buildInitialCategoryValues(
  initial?: CategoryFormDTO,
): CategoryFormValues {
  if (!initial) return buildDefaultCategoryValues();

  return {
    name: initial.name,
    description: initial.description ?? "",
    slug: initial.slug,
    sortOrder: initial.sortOrder,
    isActive: initial.isActive,
  };
}

export function slugFromName(name: string): string {
  return slugify(name);
}

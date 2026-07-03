import { slugify } from "@de-tin-marin/shared/slugify";
import type { CategoryFormValues } from "./category-form.types";

export function buildDefaultCategoryValues(): CategoryFormValues {
  return {
    name: "",
    description: "",
    slug: "",
    sortOrder: 0,
    isActive: true,
  };
}

export function slugFromName(name: string): string {
  return slugify(name);
}
